import { Prisma } from '@prisma/client'
import { prisma } from '../shared/db.js'
import { errorMessage, logger } from '../shared/logger.js'
import { fingerprint } from '../shared/text.js'
import { embedOffers, rescoreOffers } from '../matching/index.js'
import { collectFromSource, type CollectedOffer, type SourceProgress } from './collector.js'
import { helloWork } from './sources/hellowork.js'
import { indeed } from './sources/indeed.js'
import { linkedIn } from './sources/linkedin.js'
import type { ListedOffer, Source, SourceName } from './types.js'

const ALL_SOURCES: Source[] = [helloWork, indeed, linkedIn]
const TARGET_NEW_PER_SOURCE = 25

// Les recherches passent une par une : un seul Chrome à la fois et pas de rafale vers les sites
let worker: Promise<void> | undefined

export async function enqueueSearch(userId: string, query: string, location: string): Promise<string> {
  const search = await prisma.search.create({ data: { userId, query, location } })
  worker ??= drainQueue().finally(() => {
    worker = undefined
  })
  return search.id
}

async function drainQueue(): Promise<void> {
  for (;;) {
    const next = await prisma.search.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } })
    if (!next) return
    await runSearch(next.id, next.userId, next.query, next.location).catch(async err => {
      logger.error(`Recherche ${next.id} interrompue : ${errorMessage(err)}`)
      await prisma.search.update({
        where: { id: next.id },
        data: { status: 'error', error: errorMessage(err), finishedAt: new Date() },
      })
    })
  }
}

// Les offres sont communes à tous les utilisateurs, les scores et statuts sont propres à chacun
async function resolveOffer(source: SourceName, userId: string, offer: ListedOffer) {
  const existing = await prisma.offer.findFirst({
    where: { OR: [{ source, externalId: offer.externalId }, { fingerprint: fingerprint(offer.title, offer.company) }] },
    select: { id: true, matches: { where: { userId }, select: { offerId: true } } },
  })
  if (!existing) return { status: 'new' as const }
  return existing.matches.length > 0 ? { status: 'known' as const } : { status: 'claimed' as const, id: existing.id }
}

async function saveOffer(source: SourceName, searchId: string, offer: CollectedOffer): Promise<string | undefined> {
  try {
    const { id } = await prisma.offer.create({
      data: {
        source,
        searchId,
        externalId: offer.externalId,
        fingerprint: fingerprint(offer.title, offer.company),
        title: offer.title,
        company: offer.company,
        location: offer.location,
        url: offer.url,
        description: offer.description ?? '',
        contractType: offer.contractType,
        remoteType: offer.remoteType,
        seniority: offer.seniority,
        salaryMin: offer.salaryMin,
        salaryMax: offer.salaryMax,
        postedAt: offer.postedAt,
        detailsFetched: offer.detailsFetched,
      },
    })
    return id
  } catch (error) {
    // Course entre deux sources sur la même offre : déjà enregistrée, rien à faire
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return undefined
    throw error
  }
}

async function runSearch(searchId: string, userId: string, query: string, location: string): Promise<void> {
  const progress: Record<string, SourceProgress> = Object.fromEntries(
    ALL_SOURCES.map(s => [s.name, { state: 'waiting', pages: 0, listed: 0, fresh: 0 }]),
  )
  const persistProgress = () =>
    prisma.search
      .update({ where: { id: searchId }, data: { progress: JSON.stringify(progress) } })
      .catch(err => logger.warn(`Progression non enregistrée : ${errorMessage(err)}`))
  await prisma.search.update({
    where: { id: searchId },
    data: { status: 'running', startedAt: new Date(), progress: JSON.stringify(progress) },
  })
  logger.info(`Recherche « ${query} » à ${location} : démarrage`)

  const results = await Promise.all(
    ALL_SOURCES.map(source => runSource(source, { searchId, userId, query, location }, progress, persistProgress)),
  )

  const allFailed = results.every(r => r.state === 'blocked' || r.state === 'error')
  await prisma.search.update({
    where: { id: searchId },
    data: {
      status: allFailed ? 'error' : 'done',
      finishedAt: new Date(),
      progress: JSON.stringify(progress),
      foundCount: results.reduce((n, r) => n + r.listed, 0),
      newCount: results.reduce((n, r) => n + r.fresh, 0),
      error: allFailed ? "Aucune source n'a répondu" : null,
    },
  })
  logger.info(`Recherche « ${query} » terminée : ${results.reduce((n, r) => n + r.fresh, 0)} nouvelles offres`)
}

interface RunContext {
  searchId: string
  userId: string
  query: string
  location: string
}

async function runSource(
  source: Source,
  ctx: RunContext,
  progress: Record<string, SourceProgress>,
  persist: () => Promise<unknown>,
): Promise<SourceProgress> {
  const batch: string[] = []
  // Les offres sont notées par paquets : le flux se remplit pendant que la recherche continue
  const flush = async () => {
    const ids = batch.splice(0)
    if (ids.length === 0) return
    await embedOffers(ids)
    await rescoreOffers(ctx.userId, ids)
  }
  const result = await collectFromSource(source, {
    query: ctx.query,
    location: ctx.location,
    targetNew: TARGET_NEW_PER_SOURCE,
    resolve: async offer => {
      const found = await resolveOffer(source.name, ctx.userId, offer)
      // Déjà en base mais nouvelle pour cet utilisateur : il suffit de la noter pour lui
      if (found.status === 'claimed') batch.push(found.id)
      return found.status
    },
    onOffer: async offer => {
      const id = await saveOffer(source.name, ctx.searchId, offer)
      if (id) batch.push(id)
      if (batch.length >= 5) await flush()
      return id !== undefined
    },
    onProgress: p => {
      progress[source.name] = { ...p }
      void persist()
    },
  }).catch((err): SourceProgress => ({ state: 'error', pages: 0, listed: 0, fresh: 0, note: errorMessage(err) }))
  progress[source.name] = result
  await flush()
  return result
}

// Au démarrage : une recherche restée "en cours" a été coupée par un redémarrage
export async function recoverInterruptedSearches(): Promise<void> {
  await prisma.search.updateMany({
    where: { status: 'running' },
    data: { status: 'error', error: 'Interrompue par un redémarrage du serveur', finishedAt: new Date() },
  })
  if (await prisma.search.count({ where: { status: 'queued' } }))
    worker ??= drainQueue().finally(() => {
      worker = undefined
    })
}

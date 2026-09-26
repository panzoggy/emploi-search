import { errorMessage, logger } from '../shared/logger.js'
import { detectSeniority } from './offer-attributes.js'
import { SourceBlockedError, UNKNOWN_COMPANY, type ListedOffer, type OfferDetails, type Source } from './types.js'

export type SourceState = 'waiting' | 'listing' | 'details' | 'done' | 'blocked' | 'error'

export interface SourceProgress {
  state: SourceState
  pages: number
  listed: number
  fresh: number
  note?: string
}

export type CollectedOffer = ListedOffer & Partial<OfferDetails> & { detailsFetched: boolean }

export interface CollectOptions {
  query: string
  location: string
  targetNew: number
  // new = inconnue de la base ; known = déjà dans le flux de l'utilisateur ;
  // claimed = déjà en base (trouvée par quelqu'un d'autre) et ajoutée au flux de l'utilisateur
  resolve(offer: ListedOffer): Promise<'new' | 'known' | 'claimed'>
  onOffer(offer: CollectedOffer): Promise<boolean>
  onProgress(progress: SourceProgress): void
}

// Au-delà de 3 pages sans rien de nouveau, les suivantes (plus anciennes) le seront aussi
const MAX_STALE_PAGES = 3

// Le détail de la page prime sur la carte de la liste, sauf quand il est vide
const mergeDetails = (offer: ListedOffer, details: OfferDetails | null): CollectedOffer => ({
  ...offer,
  // Certaines cartes masquent l'employeur, que la page de l'offre révèle
  company: offer.company === UNKNOWN_COMPANY ? (details?.company ?? offer.company) : offer.company,
  description: details?.description ?? '',
  postedAt: details?.postedAt ?? offer.postedAt,
  contractType: details?.contractType ?? offer.contractType,
  remoteType: details?.remoteType ?? offer.remoteType,
  seniority: details?.seniority ?? detectSeniority(offer.title),
  salaryMin: details?.salaryMin ?? offer.salaryMin,
  salaryMax: details?.salaryMax ?? offer.salaryMax,
  detailsFetched: details !== null,
})

// Parcourt les pages d'un site jusqu'à trouver `targetNew` offres jamais vues, puis s'arrête
export async function collectFromSource(source: Source, options: CollectOptions): Promise<SourceProgress> {
  const progress: SourceProgress = { state: 'listing', pages: 0, listed: 0, fresh: 0 }
  const update = (patch: Partial<SourceProgress>) => options.onProgress(Object.assign(progress, patch))
  update({})
  const session = await source.open()
  try {
    await walkPages(source, session, options, progress, update)
    update({ state: 'done' })
  } catch (error) {
    const blocked = error instanceof SourceBlockedError
    logger.warn(`[${source.name}] ${errorMessage(error)}`)
    update({
      state: blocked && progress.fresh === 0 ? 'blocked' : progress.fresh > 0 ? 'done' : 'error',
      note: errorMessage(error),
    })
  } finally {
    await session.close()
  }
  return progress
}

async function walkPages(
  source: Source,
  session: Awaited<ReturnType<Source['open']>>,
  options: CollectOptions,
  progress: SourceProgress,
  update: (patch: Partial<SourceProgress>) => void,
): Promise<void> {
  const seenThisRun = new Set<string>()
  let stalePages = 0
  for (let pageIndex = 0; pageIndex < source.maxPages; pageIndex++) {
    update({ state: 'listing' })
    const page = await session.listPage(options.query, options.location, pageIndex)
    update({ pages: progress.pages + 1, listed: progress.listed + page.offers.length })
    let freshOnPage = 0
    for (const offer of page.offers) {
      if (seenThisRun.has(offer.externalId)) continue
      seenThisRun.add(offer.externalId)
      if (!(await collectOne(source, session, options, offer, update))) continue
      freshOnPage++
      update({ fresh: progress.fresh + 1 })
      if (progress.fresh >= options.targetNew) return
    }
    stalePages = freshOnPage === 0 ? stalePages + 1 : 0
    if (!page.hasMore || stalePages >= MAX_STALE_PAGES) {
      if (page.endReason) update({ note: page.endReason })
      return
    }
  }
}

// Une offre de la liste : ignorée si déjà connue, sinon détaillée et enregistrée. Renvoie vrai si elle est nouvelle.
async function collectOne(
  source: Source,
  session: Awaited<ReturnType<Source['open']>>,
  options: CollectOptions,
  offer: ListedOffer,
  update: (patch: Partial<SourceProgress>) => void,
): Promise<boolean> {
  const status = await options.resolve(offer)
  if (status !== 'new') return status === 'claimed'
  update({ state: 'details' })
  const details = await session.fetchDetails(offer).catch((err: unknown) => {
    logger.warn(`[${source.name}] Détail indisponible pour ${offer.url} : ${errorMessage(err)}`)
    return null
  })
  return options.onOffer(mergeDetails(offer, details))
}

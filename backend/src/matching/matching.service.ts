import { prisma } from '../shared/db.js'
import { errorMessage, logger } from '../shared/logger.js'
import { readProfile, type ProfileData } from '../profile/index.js'
import { embed } from './embeddings.js'
import { scoreOffer, type FeedbackSignal, type ProfileSignals } from './scoring.js'
import { centroid, fromBytes, toBytes } from './vectors.js'

const DESCRIPTION_CHARS = 1500
const WRITE_CHUNK = 200

// Calcule les vecteurs des offres qui n'en ont pas encore
export async function embedOffers(offerIds: string[]): Promise<void> {
  const offers = await prisma.offer.findMany({
    where: { id: { in: offerIds }, textVector: null },
    select: { id: true, title: true, company: true, description: true },
  })
  if (offers.length === 0) return
  const titleVectors = await embed(
    offers.map(o => o.title),
    'passage',
  )
  const textVectors = await embed(
    offers.map(o => `${o.title}. ${o.company}. ${o.description.slice(0, DESCRIPTION_CHARS)}`),
    'passage',
  )
  await prisma.$transaction(
    offers.map((offer, i) =>
      prisma.offer.update({
        where: { id: offer.id },
        data: { titleVector: toBytes(titleVectors[i]), textVector: toBytes(textVectors[i]) },
      }),
    ),
  )
}

async function feedbackSignal(userId: string, statuses: string[]): Promise<FeedbackSignal | undefined> {
  const rows = await prisma.offerStatus.findMany({
    where: { userId, status: { in: statuses } },
    select: { offer: { select: { textVector: true } } },
  })
  const vectors = rows.flatMap(r => (r.offer.textVector ? [fromBytes(r.offer.textVector)] : []))
  const center = centroid(vectors)
  return center ? { centroid: center, count: vectors.length } : undefined
}

const profileText = (p: ProfileData): string =>
  [
    p.targetTitles.join(', '),
    p.skills.length ? `Compétences : ${p.skills.join(', ')}` : '',
    (p.cvText ?? '').slice(0, 1200),
  ]
    .filter(Boolean)
    .join('. ')

async function buildProfileSignals(userId: string): Promise<ProfileSignals> {
  const profile = await readProfile(userId)
  const text = profileText(profile)
  const [targetVectors, [profileVector], liked, rejected] = await Promise.all([
    profile.targetTitles.length ? embed(profile.targetTitles, 'query') : Promise.resolve([]),
    text ? embed([text], 'query') : Promise.resolve([undefined]),
    feedbackSignal(userId, ['FAVORITE', 'INTERESTED']),
    feedbackSignal(userId, ['REJECTED']),
  ])
  return { ...profile, targetVectors, profileVector, liked, rejected }
}

// Recalcule le score des offres données, ou de tout le flux de l'utilisateur si non précisé.
// Jamais "toutes les offres" : la base est commune, un utilisateur ne voit que ce que ses recherches ont trouvé.
export async function rescoreOffers(userId: string, offerIds?: string[]): Promise<number> {
  const signals = await buildProfileSignals(userId)
  const offers = await prisma.offer.findMany({
    where: offerIds ? { id: { in: offerIds } } : { matches: { some: { userId } } },
  })
  const matches = offers.map(offer => ({
    offerId: offer.id,
    ...scoreOffer(signals, {
      ...offer,
      titleVector: offer.titleVector ? fromBytes(offer.titleVector) : undefined,
      textVector: offer.textVector ? fromBytes(offer.textVector) : undefined,
    }),
  }))
  for (let i = 0; i < matches.length; i += WRITE_CHUNK) {
    await prisma.$transaction(
      matches.slice(i, i + WRITE_CHUNK).map(({ offerId, score, excluded, reasons }) => {
        const data = { score, excluded, reasons: JSON.stringify(reasons) }
        return prisma.offerMatch.upsert({
          where: { userId_offerId: { userId, offerId } },
          update: data,
          create: { userId, offerId, ...data },
        })
      }),
    )
  }
  return matches.length
}

// Après un changement de profil ou de retours : un recalcul complet par utilisateur, regroupé
// (plusieurs clics rapprochés = un seul calcul) et jamais deux en parallèle
const pending = new Map<string, NodeJS.Timeout>()
let running: Promise<unknown> = Promise.resolve()

export function scheduleRescore(userId: string, delayMs = 1500): void {
  clearTimeout(pending.get(userId))
  pending.set(
    userId,
    setTimeout(() => {
      pending.delete(userId)
      running = running
        .then(async () => {
          const started = Date.now()
          const count = await rescoreOffers(userId)
          logger.info(`Scores recalculés pour ${count} offres en ${Date.now() - started} ms`)
        })
        .catch(err => logger.error(`Recalcul des scores impossible : ${errorMessage(err)}`))
    }, delayMs),
  )
}

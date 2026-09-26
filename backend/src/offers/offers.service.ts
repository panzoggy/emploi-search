import type { Prisma } from '@prisma/client'
import { prisma } from '../shared/db.js'
import type { MatchReason } from '../matching/index.js'
import { offerConditions, type FeedFilters } from './feed-filters.js'

export const VIEWS = ['new', 'favorites', 'interested', 'seen', 'rejected'] as const
export type FeedView = (typeof VIEWS)[number]
export const STATUSES = ['SEEN', 'FAVORITE', 'INTERESTED', 'REJECTED'] as const
export type OfferStatusValue = (typeof STATUSES)[number]

const VIEW_STATUS: Record<Exclude<FeedView, 'new'>, OfferStatusValue> = {
  favorites: 'FAVORITE',
  interested: 'INTERESTED',
  seen: 'SEEN',
  rejected: 'REJECTED',
}

export interface FeedQuery extends FeedFilters {
  view: FeedView
  sort: 'score' | 'date'
  offset: number
  limit: number
}

const offerSelect = {
  id: true,
  source: true,
  title: true,
  company: true,
  location: true,
  url: true,
  contractType: true,
  remoteType: true,
  seniority: true,
  salaryMin: true,
  salaryMax: true,
  postedAt: true,
  scrapedAt: true,
  detailsFetched: true,
} satisfies Prisma.OfferSelect

function feedWhere(userId: string, query: FeedQuery): Prisma.OfferMatchWhereInput {
  const status: Prisma.OfferWhereInput =
    query.view === 'new'
      ? { statuses: { none: { userId } } }
      : { statuses: { some: { userId, status: VIEW_STATUS[query.view] } } }
  return {
    userId,
    offer: { AND: [status, ...offerConditions(query)] },
    ...(query.minScore ? { score: { gte: query.minScore } } : {}),
    // Les offres exclues par le profil (mot-clé, entreprise) ne polluent pas les nouvelles
    ...(query.view === 'new' ? { excluded: false } : {}),
  }
}

// La table des scores sert de racine : c'est elle qui permet de trier par pertinence
export async function listFeed(userId: string, query: FeedQuery) {
  const where = feedWhere(userId, query)
  const orderBy: Prisma.OfferMatchOrderByWithRelationInput[] =
    query.sort === 'score'
      ? [{ score: 'desc' }, { offer: { postedAt: 'desc' } }]
      : [{ offer: { postedAt: { sort: 'desc', nulls: 'last' } } }, { offer: { scrapedAt: 'desc' } }]
  const [rows, total] = await Promise.all([
    prisma.offerMatch.findMany({
      where,
      orderBy,
      skip: query.offset,
      take: query.limit,
      include: { offer: { select: { ...offerSelect, statuses: { where: { userId }, select: { status: true } } } } },
    }),
    prisma.offerMatch.count({ where }),
  ])
  const offers = rows.map(({ offer: { statuses, ...offer }, score, reasons, excluded }) => ({
    ...offer,
    status: statuses[0]?.status ?? null,
    score,
    excluded,
    reasons: JSON.parse(reasons) as MatchReason[],
  }))
  return { offers, total, hasMore: query.offset + offers.length < total }
}

export async function getOffer(userId: string, offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      ...offerSelect,
      description: true,
      statuses: { where: { userId }, select: { status: true, reason: true } },
      matches: { where: { userId }, select: { score: true, reasons: true, excluded: true } },
      search: { select: { query: true, location: true, userId: true } },
    },
  })
  if (!offer) return null
  // Hors du flux de l'utilisateur : l'offre n'existe pas pour lui
  if (offer.matches.length === 0) return null
  const { statuses, matches, search, ...rest } = offer
  return {
    ...rest,
    // La recherche d'origine appartient peut-être à un autre utilisateur : on ne la montre qu'à son auteur
    search: search?.userId === userId ? { query: search.query, location: search.location } : null,
    status: statuses[0]?.status ?? null,
    score: matches[0]?.score ?? null,
    excluded: matches[0]?.excluded ?? false,
    reasons: matches[0] ? (JSON.parse(matches[0].reasons) as MatchReason[]) : [],
  }
}

export async function countByView(userId: string): Promise<Record<FeedView, number>> {
  const [fresh, grouped] = await Promise.all([
    prisma.offerMatch.count({ where: { userId, excluded: false, offer: { statuses: { none: { userId } } } } }),
    prisma.offerStatus.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
  ])
  const count = (status: OfferStatusValue) => grouped.find(g => g.status === status)?._count._all ?? 0
  return {
    new: fresh,
    favorites: count('FAVORITE'),
    interested: count('INTERESTED'),
    seen: count('SEEN'),
    rejected: count('REJECTED'),
  }
}

// "Vue" ne remplace jamais un classement plus fort (favori, intéressé, écartée)
const inFeed = async (userId: string, offerId: string): Promise<boolean> =>
  (await prisma.offerMatch.count({ where: { userId, offerId } })) > 0

export async function setStatus(
  userId: string,
  offerId: string,
  status: OfferStatusValue,
  reason?: string,
): Promise<boolean> {
  if (!(await inFeed(userId, offerId))) return false
  if (status === 'SEEN') {
    await prisma.offerStatus.upsert({
      where: { userId_offerId: { userId, offerId } },
      update: {},
      create: { userId, offerId, status },
    })
    return true
  }
  const data = { status, reason: reason ?? null }
  await prisma.offerStatus.upsert({
    where: { userId_offerId: { userId, offerId } },
    update: data,
    create: { userId, offerId, ...data },
  })
  return true
}

export async function clearStatus(userId: string, offerId: string): Promise<void> {
  await prisma.offerStatus.deleteMany({ where: { userId, offerId } })
}

import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { httpClient, isBlockedStatus, politeDelay } from '../http.js'
import { extractJobPosting } from '../json-ld.js'
import { detailsFromPosting } from '../offer-details.js'
import { detectRemote, normalizeContract } from '../offer-attributes.js'
import { parseSalaryText } from '../salary.js'
import { SourceBlockedError, UNKNOWN_COMPANY, type ListedOffer, type Source, type SourceSession } from '../types.js'

const BASE_URL = 'https://www.hellowork.com'
const PAGE_SIZE = 30

const UNIT_MS: Record<string, number> = {
  minute: 60_000,
  heure: 3_600_000,
  jour: 86_400_000,
  semaine: 604_800_000,
  mois: 2_592_000_000,
}

const parseRelativeDate = (text: string): Date | undefined => {
  const match = text.match(/il y a (\d+) (minute|heure|jour|semaine|mois)/i)
  return match ? new Date(Date.now() - Number(match[1]) * UNIT_MS[match[2].toLowerCase()]) : undefined
}

// Les attributs data-cy servent aux tests Cypress de HelloWork : bien plus stables que les classes CSS
function readCard($: cheerio.CheerioAPI, card: cheerio.Cheerio<AnyNode>): ListedOffer | null {
  const link = card.find('a[data-cy="offerTitle"]').first()
  const href = link.attr('href') ?? ''
  const externalId = href.match(/\/emplois\/(\d+)\.html/)?.[1]
  const [titleEl, companyEl] = link.find('h3 p').toArray()
  const title = titleEl ? $(titleEl).text().trim() : ''
  if (!externalId || !title) return null

  const tags = card
    .find('.tag-secondary-s')
    .map((_, el) => $(el).text().trim())
    .get()
  return {
    externalId,
    title,
    company: (companyEl ? $(companyEl).text().trim() : '') || UNKNOWN_COMPANY,
    location: card.find('[data-cy="localisationCard"]').first().text().trim(),
    url: `${BASE_URL}${href}`,
    contractType: normalizeContract(card.find('[data-cy="contractCard"]').first().text()),
    remoteType: detectRemote(...tags),
    ...parseSalaryText(tags.find(tag => tag.includes('€'))),
    postedAt: parseRelativeDate(card.find('.text-grey-500').last().text()),
  }
}

async function fetchHtml(url: string): Promise<string> {
  try {
    return (await httpClient.get<string>(url, { headers: { Referer: `${BASE_URL}/` } })).data
  } catch (error) {
    if (isBlockedStatus(error)) throw new SourceBlockedError('HelloWork refuse les requêtes (403/429)')
    throw error
  }
}

const session: SourceSession = {
  async listPage(query, location, pageIndex) {
    const params = new URLSearchParams({ k: query, l: location, st: 'date', p: String(pageIndex + 1) })
    const $ = cheerio.load(await fetchHtml(`${BASE_URL}/fr-fr/emploi/recherche.html?${params}`))
    const offers = $('[data-cy="serpCard"]')
      .toArray()
      .map(el => readCard($, $(el)))
      .filter((o): o is ListedOffer => o !== null)
    return { offers, hasMore: offers.length >= PAGE_SIZE }
  },
  async fetchDetails(offer) {
    await politeDelay()
    const posting = extractJobPosting(await fetchHtml(offer.url))
    return posting ? detailsFromPosting(posting, offer.title) : null
  },
  async close() {},
}

export const helloWork: Source = { name: 'HELLOWORK', maxPages: 10, open: async () => session }

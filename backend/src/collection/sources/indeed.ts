import * as cheerio from 'cheerio'
import { openBrowser, waitForContent } from '../browser.js'
import { politeDelay } from '../http.js'
import { extractJobPosting } from '../json-ld.js'
import { detailsFromPosting } from '../offer-details.js'
import { detectRemote, normalizeContract } from '../offer-attributes.js'
import { parseSalaryText } from '../salary.js'
import { SourceBlockedError, UNKNOWN_COMPANY, type ListedOffer, type Source, type SourceSession } from '../types.js'

// Indeed est derrière Cloudflare : une requête HTTP simple reçoit un 403.
// On passe par un vrai Chrome, puis on lit le HTML rendu (liste) et le JSON-LD (détail).
const BASE_URL = 'https://fr.indeed.com'

function readCards(html: string): ListedOffer[] {
  const $ = cheerio.load(html)
  return $('.job_seen_beacon')
    .toArray()
    .map((el): ListedOffer | null => {
      const card = $(el)
      const link = card.find('a[data-jk]').first()
      const jk = link.attr('data-jk')
      const title = (card.find('h2.jobTitle span[title]').attr('title') ?? link.text()).trim()
      if (!jk || !title) return null
      const attributes = card
        .find('[data-testid="attribute_snippet_testid"]')
        .map((_, a) => $(a).text().trim())
        .get()
      const location = card.find('[data-testid="text-location"]').first().text().trim()
      return {
        externalId: jk,
        title,
        company: card.find('[data-testid="company-name"]').first().text().trim() || UNKNOWN_COMPANY,
        location,
        url: `${BASE_URL}/viewjob?jk=${jk}`,
        contractType: normalizeContract(...attributes),
        remoteType: detectRemote(location, ...attributes),
        ...parseSalaryText(attributes.find(a => a.includes('€'))),
      }
    })
    .filter((o): o is ListedOffer => o !== null)
}

async function openSession(): Promise<SourceSession> {
  const browser = await openBrowser()
  const { page } = browser
  return {
    async listPage(query, location, pageIndex) {
      if (pageIndex > 0) await politeDelay(1500, 3000)
      const params = new URLSearchParams({ q: query, l: location, sort: 'date', start: String(pageIndex * 10) })
      await page.goto(`${BASE_URL}/jobs?${params}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      const state = await waitForContent(page, 'a[data-jk]')
      if (state === 'blocked') throw new SourceBlockedError('Indeed a bloqué la requête (anti-bot Cloudflare)')
      // Sans compte, Indeed ne sert que la première page de résultats
      if (state === 'login')
        return { offers: [], hasMore: false, endReason: 'Indeed exige un compte au-delà de la page 1' }
      if (state === 'empty') return { offers: [], hasMore: false }
      const html = await page.content()
      return { offers: readCards(html), hasMore: cheerio.load(html)('[data-testid="pagination-page-next"]').length > 0 }
    },
    async fetchDetails(offer) {
      await politeDelay(800, 1600)
      await page.goto(offer.url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      const found = await page
        .waitForSelector('script[type="application/ld+json"]', { state: 'attached', timeout: 15_000 })
        .then(
          () => true,
          () => false,
        )
      const posting = found ? extractJobPosting(await page.content()) : undefined
      return posting ? detailsFromPosting(posting, offer.title) : null
    },
    close: () => browser.close(),
  }
}

export const indeed: Source = { name: 'INDEED', maxPages: 5, open: openSession }

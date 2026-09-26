import * as cheerio from 'cheerio'
import { httpClient, isBlockedStatus, politeDelay } from '../http.js'
import { htmlToText } from '../json-ld.js'
import { contractFromDescription, detectRemote, detectSeniority, normalizeContract } from '../offer-attributes.js'
import { parseSalaryText } from '../salary.js'
import {
  SourceBlockedError,
  UNKNOWN_COMPANY,
  type ListedOffer,
  type Seniority,
  type Source,
  type SourceSession,
} from '../types.js'

// API "invité" de LinkedIn : celle qui alimente la page publique des offres, sans compte
const API = 'https://www.linkedin.com/jobs-guest/jobs/api'
const PAGE_SIZE = 10

const SENIORITY_LEVELS: Record<string, Seniority> = {
  internship: 'intern',
  'entry level': 'junior',
  associate: 'junior',
  'mid-senior level': 'senior',
  director: 'lead',
  executive: 'lead',
}

async function fetchHtml(url: string): Promise<string> {
  try {
    return (await httpClient.get<string>(url)).data
  } catch (error) {
    if (isBlockedStatus(error)) throw new SourceBlockedError('LinkedIn limite les requêtes (429)')
    throw error
  }
}

const session: SourceSession = {
  async listPage(query, location, pageIndex) {
    const params = new URLSearchParams({
      keywords: query,
      location,
      sortBy: 'DD',
      start: String(pageIndex * PAGE_SIZE),
    })
    const $ = cheerio.load(await fetchHtml(`${API}/seeMoreJobPostings/search?${params}`))
    const offers = $('li')
      .toArray()
      .map((el): ListedOffer | null => {
        const card = $(el)
        const externalId = card
          .find('[data-entity-urn]')
          .attr('data-entity-urn')
          ?.match(/jobPosting:(\d+)/)?.[1]
        const title = card.find('.base-search-card__title').text().trim()
        if (!externalId || !title) return null
        const datetime = card.find('time').attr('datetime')
        return {
          externalId,
          title,
          company: card.find('.base-search-card__subtitle').text().trim() || UNKNOWN_COMPANY,
          location: card.find('.job-search-card__location').text().trim(),
          url: `https://www.linkedin.com/jobs/view/${externalId}`,
          ...parseSalaryText(card.find('.job-search-card__salary-info').text()),
          postedAt: datetime ? new Date(datetime) : undefined,
        }
      })
      .filter((o): o is ListedOffer => o !== null)
    return { offers, hasMore: offers.length >= PAGE_SIZE }
  },
  async fetchDetails(offer) {
    await politeDelay(800, 1800)
    const $ = cheerio.load(await fetchHtml(`${API}/jobPosting/${offer.externalId}`))
    const description = htmlToText($('.show-more-less-html__markup').first().html() ?? '')
    const criteria = Object.fromEntries(
      $('.description__job-criteria-item')
        .toArray()
        .map(el => [
          $(el).find('.description__job-criteria-subheader').text().trim().toLowerCase(),
          $(el).find('.description__job-criteria-text').text().trim(),
        ]),
    )
    return {
      description,
      contractType: contractFromDescription(description) ?? normalizeContract(offer.title, criteria['employment type']),
      remoteType: detectRemote(offer.location, description),
      seniority:
        detectSeniority(offer.title, description) ??
        SENIORITY_LEVELS[(criteria['seniority level'] ?? '').toLowerCase()],
    }
  },
  async close() {},
}

export const linkedIn: Source = { name: 'LINKEDIN', maxPages: 10, open: async () => session }

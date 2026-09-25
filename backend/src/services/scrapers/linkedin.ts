import * as cheerio from 'cheerio'
import { BaseScraper, ScrapedJob, SearchOptions, httpClient } from '../scraper.js'

export class LinkedInScraper extends BaseScraper {
  protected source = 'LINKEDIN' as const
  protected baseUrl = 'https://www.linkedin.com'

  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 2

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const start = pageNum * 25

      // LinkedIn public jobs API — no login required
      const searchUrl = `${this.baseUrl}/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}&f_TPR=r86400`

      console.log(`[LINKEDIN] Fetching page ${pageNum + 1}: ${searchUrl}`)

      try {
        const response = await httpClient.get(searchUrl, {
          headers: {
            'Referer': `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        })

        const $ = cheerio.load(response.data)

        // LinkedIn returns <li> cards
        const jobCards = $('li')

        if (jobCards.length === 0) {
          console.log(`[LINKEDIN] No cards on page ${pageNum + 1} (content: ${response.data.length})`)
          break
        }

        console.log(`[LINKEDIN] Found ${jobCards.length} job cards on page ${pageNum + 1}`)

        jobCards.each((_, el) => {
          const job = this.extractJob($, $(el))
          if (job) jobs.push(job)
        })

        if (pageNum < maxPages - 1) await this.randomDelay(1500, 3000)
        if (jobCards.length < 25) break // last page
      } catch (error: any) {
        console.error(`[LINKEDIN] Error on page ${pageNum + 1}:`, error.message)
        if (error.response?.status === 429) {
          console.log('[LINKEDIN] Rate limited, stopping')
          break
        }
        // LinkedIn sometimes returns 400 for out-of-range pages
        if (error.response?.status === 400) break
      }
    }

    console.log(`[LINKEDIN] Total jobs found: ${jobs.length}`)
    return jobs
  }

  private extractJob($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): ScrapedJob | null {
    // Title
    const titleEl = card.find('h3.base-search-card__title, h3, .job-result-card__title').first()
    const title = titleEl.text().trim()
    if (!title) return null

    // URL — LinkedIn job links
    const linkEl = card.find('a.base-card__full-link, a.job-result-card__full-card-link, a[href*="/jobs/view/"]').first()
    const href = linkEl.attr('href') || ''
    const url = href.split('?')[0] || ''

    if (!url) return null

    // External ID
    const externalId = url.match(/\/jobs\/view\/(\d+)/)?.[1] || url

    // Company
    const company = card.find('h4.base-search-card__subtitle, h4, .job-result-card__subtitle').first().text().trim() || 'Unknown'

    // Location
    const location = card.find('.job-search-card__location, .job-result-card__location, span.job-result-card__location').first().text().trim() || ''

    // Posted date — LinkedIn provides this as time element
    const postedAtText = card.find('time').attr('datetime')
    const postedAt = postedAtText ? new Date(postedAtText) : new Date()

    // Description — not available in list view, use title as fallback
    const description = card.find('.job-result-card__snippet, .base-search-card__snippet').first().text().trim() || ''

    return {
      externalId,
      source: this.source,
      title,
      company,
      location,
      description,
      url,
      postedAt,
    }
  }
}

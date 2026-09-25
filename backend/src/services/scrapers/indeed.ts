import * as cheerio from 'cheerio'
import { BaseScraper, ScrapedJob, SearchOptions, httpClient } from '../scraper.js'

export class IndeedScraper extends BaseScraper {
  protected source = 'INDEED' as const
  protected baseUrl = 'https://fr.indeed.com'

  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 3

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const start = pageNum * 10
      const searchUrl = `${this.baseUrl}/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}&lang=fr`

      console.log(`[INDEED] Fetching page ${pageNum + 1}: ${searchUrl}`)

      try {
        const response = await httpClient.get(searchUrl, {
          headers: {
            'Referer': pageNum === 0 ? 'https://fr.indeed.com/' : `${this.baseUrl}/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${(pageNum - 1) * 10}`,
            'Cookie': 'CTK=1; indeed_rcc="CTK"; SURF=; INDEED_CSRF_TOKEN=',
          },
        })

        const $ = cheerio.load(response.data)

        // Indeed wraps jobs in mosaic-provider-jobcards
        const jobCards = $('[data-jk], .job_seen_beacon, .result')

        if (jobCards.length === 0) {
          console.log(`[INDEED] No job cards found on page ${pageNum + 1} (content length: ${response.data.length})`)
          // Try to detect CAPTCHA / block
          if (response.data.includes('captcha') || response.data.includes('robot') || response.data.length < 5000) {
            console.log('[INDEED] Possible block/CAPTCHA detected, stopping')
            break
          }
          break
        }

        console.log(`[INDEED] Found ${jobCards.length} job cards on page ${pageNum + 1}`)

        jobCards.each((_, el) => {
          const job = this.extractJob($, $(el))
          if (job) jobs.push(job)
        })

        if (pageNum < maxPages - 1) await this.randomDelay(1000, 2500)

        // Check for next page
        const hasNext = $('a[data-testid="pagination-page-next"], [aria-label="Suivant"]').length > 0
        if (!hasNext) break
      } catch (error: any) {
        console.error(`[INDEED] Error on page ${pageNum + 1}:`, error.message)
        if (error.response?.status === 403 || error.response?.status === 429) {
          console.log('[INDEED] Rate limited or blocked, stopping')
          break
        }
      }
    }

    console.log(`[INDEED] Total jobs found: ${jobs.length}`)
    return jobs
  }

  private extractJob($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): ScrapedJob | null {
    // Title
    const titleEl = card.find('h2.jobTitle a, h2 a[data-jk], [data-testid="job-title"] a, h2 span[title]')
    const title = titleEl.first().text().trim() || card.find('h2').first().text().trim()
    if (!title) return null

    // URL
    const href = titleEl.first().attr('href') || card.find('a[data-jk]').first().attr('href') || ''
    const jk = card.attr('data-jk') || href.match(/jk=([a-f0-9]+)/)?.[1] || ''
    const url = jk ? `${this.baseUrl}/viewjob?jk=${jk}` : (href.startsWith('http') ? href : `${this.baseUrl}${href}`)

    // Company
    const company = card.find('[data-testid="company-name"], .companyName, .company').first().text().trim() || 'Unknown'

    // Location
    const location = card.find('[data-testid="job-location"], .companyLocation, .location').first().text().trim() || ''

    // Salary
    const salaryText = card.find('[data-testid="salary-snippet-container"], .salary-snippet, .estimated-salary').first().text().trim()
    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryText)

    // Contract type
    const contractType = card.find('[data-testid="attribute_snippet_testid"], .jobTypes').first().text().trim() || undefined

    // Remote
    const remoteType = card.find('[data-testid="remote-type"]').first().text().trim() || undefined

    // Description snippet
    const description = card.find('.job-snippet, [data-testid="job-snippet"]').first().text().trim() || ''

    // External ID
    const externalId = jk || url

    return {
      externalId,
      source: this.source,
      title,
      company,
      location,
      description,
      url,
      salaryMin,
      salaryMax,
      contractType,
      remoteType,
      postedAt: new Date(),
    }
  }
}

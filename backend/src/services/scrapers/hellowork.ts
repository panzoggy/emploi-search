import * as cheerio from 'cheerio'
import { BaseScraper, ScrapedJob, SearchOptions, httpClient } from '../scraper.js'

export class HelloWorkScraper extends BaseScraper {
  protected source = 'HELLOWORK' as const
  protected baseUrl = 'https://www.hellowork.com'

  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 3

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const searchUrl = `${this.baseUrl}/fr-fr/emploi/recherche.html?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&p=${pageNum}`

      console.log(`[HELLOWORK] Fetching page ${pageNum}: ${searchUrl}`)

      try {
        const response = await httpClient.get(searchUrl, {
          headers: {
            'Referer': pageNum === 1 ? 'https://www.hellowork.com/' : `${this.baseUrl}/fr-fr/emploi/recherche.html?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&p=${pageNum - 1}`,
          },
        })

        const $ = cheerio.load(response.data)

        // HelloWork uses <li> tags with data-id-offre or article tags
        const jobCards = $('li[data-id-offre], article[data-id-offre], [data-analytics-event="job_offer_click"]').closest('li, article')

        if (jobCards.length === 0) {
          // Fallback: try generic job card selectors
          const altCards = $('ul.job-list li, .offers-list li, .job-card')
          if (altCards.length === 0) {
            console.log(`[HELLOWORK] No job cards on page ${pageNum} (content: ${response.data.length})`)
            break
          }
          console.log(`[HELLOWORK] Found ${altCards.length} jobs (alt selector) on page ${pageNum}`)
          altCards.each((_, el) => {
            const job = this.extractJob($, $(el))
            if (job) jobs.push(job)
          })
        } else {
          console.log(`[HELLOWORK] Found ${jobCards.length} jobs on page ${pageNum}`)
          jobCards.each((_, el) => {
            const job = this.extractJob($, $(el))
            if (job) jobs.push(job)
          })
        }

        if (pageNum < maxPages) await this.randomDelay(800, 2000)

        const hasNext = $('a[rel="next"], .pagination-next a, [aria-label="Page suivante"]').length > 0
        if (!hasNext) break
      } catch (error: any) {
        console.error(`[HELLOWORK] Error on page ${pageNum}:`, error.message)
        if (error.response?.status === 403 || error.response?.status === 429) {
          console.log('[HELLOWORK] Rate limited, stopping')
          break
        }
      }
    }

    console.log(`[HELLOWORK] Total jobs found: ${jobs.length}`)
    return jobs
  }

  private extractJob($: cheerio.CheerioAPI, card: cheerio.Cheerio<any>): ScrapedJob | null {
    // Title — HelloWork usually uses h2 or h3 inside the card
    const titleEl = card.find('h2 a, h3 a, .job-title a, [data-testid="job-title"], a.job-title').first()
    const title = titleEl.text().trim() || card.find('h2, h3').first().text().trim()
    if (!title) return null

    // URL
    const href = titleEl.attr('href') || card.find('a').first().attr('href') || ''
    const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`

    // External ID from URL or data attribute
    const externalId = card.attr('data-id-offre') || 
      url.match(/\/offre\/([^/?]+)/)?.[1] || 
      url.match(/id=(\d+)/)?.[1] || 
      url

    // Company
    const company = card.find('.company-name, .employer, [data-testid="company-name"], .entreprise').first().text().trim() || 'Unknown'

    // Location
    const location = card.find('.location, .job-location, [data-testid="location"], .lieu').first().text().trim() || ''

    // Salary
    const salaryText = card.find('.salary, .salaire, [data-testid="salary"], .remuneration').first().text().trim()
    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryText)

    // Contract type
    const contractType = card.find('.contract-type, .type-contrat, .contrat, [data-testid="contract"]').first().text().trim() || undefined

    // Description
    const description = card.find('.job-description, .description, .resume, .teaser').first().text().trim() || ''

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
      postedAt: new Date(),
    }
  }
}

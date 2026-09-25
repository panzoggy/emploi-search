import { BaseScraper, ScrapedJob, SearchOptions } from '../scraper.js'
import type { Page } from 'puppeteer'

export class IndeedScraper extends BaseScraper {
  protected source = 'INDEED' as const
  protected baseUrl = 'https://fr.indeed.com'
  
  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const page = await this.createPage()
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 3
    
    try {
      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        const start = pageNum * 10
        const searchUrl = `${this.baseUrl}/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`
        
        console.log(`[INDEED] Fetching page ${pageNum + 1}: ${searchUrl}`)
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        await this.randomDelay()
        
        // Try multiple selectors for Indeed's changing layout
        let jobCards = await page.$$('.job_seen_beacon, .slider_container .jobsearch-ResultsList__job-card, .jobsearch-ResultsList .job_seen_beacon, [data-testid="job-card"], .result')
        
        if (jobCards.length === 0) {
          console.log(`[INDEED] No job cards found on page ${pageNum + 1}, trying alternative selectors`)
          jobCards = await page.$$('.jobsearch-SerpJobCard, .job_card, .resultContent, .jobResult')
        }
        
        if (jobCards.length === 0) {
          console.log(`[INDEED] Still no job cards found on page ${pageNum + 1}`)
          // Log page content for debugging
          const pageContent = await page.content()
          console.log(`[INDEED] Page content length: ${pageContent.length}`)
          break
        }
        
        console.log(`[INDEED] Found ${jobCards.length} job cards on page ${pageNum + 1}`)
        
        for (const card of jobCards) {
          try {
            const job = await this.extractJobFromCard(page, card)
            if (job) jobs.push(job)
          } catch (error) {
            console.error('[INDEED] Error extracting job:', error)
          }
        }
        
        const nextButton = await page.$('a[data-testid="pagination-page-next"], a[aria-label="Next"], .pagination a:last-child')
        if (!nextButton) break
      }
    } finally {
      await page.close()
    }
    
    console.log(`[INDEED] Total jobs found: ${jobs.length}`)
    return jobs
  }
  
  private async extractJobFromCard(page: Page, card: any): Promise<ScrapedJob | null> {
    // Try multiple selectors for title
    let titleEl = await card.$('h2 a, h2 span, [data-testid="job-title"], .jobTitle')
    let title = await titleEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!title) {
      // Try alternative title selectors
      titleEl = await card.$('.jobTitle, .job-title, [title], h2, h3')
      title = await titleEl?.evaluate((el: any) => el.textContent?.trim())
    }
    
    if (!title) return null
    
    const linkEl = await card.$('h2 a, [data-testid="job-title"] a, a[href*="/jobs/"]')
    const href = await linkEl?.evaluate((el: any) => el.getAttribute('href'))
    const url = href ? `https://fr.indeed.com${href}` : ''
    
    // Try multiple selectors for company
    let companyEl = await card.$('[data-testid="company-name"], .companyName, .company_location, [data-company-name]')
    let company = await companyEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!company || company === 'Unknown') {
      companyEl = await card.$('.company, .companyName, [data-testid="company-name"], span.company')
      company = await companyEl?.evaluate((el: any) => el.textContent?.trim()) || 'Unknown'
    }
    
    // Try multiple selectors for location
    let locationEl = await card.$('[data-testid="job-location"], .companyLocation, [data-testid="job-location"]')
    let location = await locationEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!location) {
      locationEl = await card.$('.location, .job-location, [data-testid="job-location"]')
      location = await locationEl?.evaluate((el: any) => el.textContent?.trim()) || ''
    }
    
    const salaryEl = await card.$('[data-testid="salary-snippet"], .salary-snippet, .salary')
    const salaryText = await salaryEl?.evaluate((el: any) => el.textContent?.trim())
    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryText)
    
    const typeEl = await card.$('[data-testid="job-type"], .jobType, .jobType')
    const contractType = await typeEl?.evaluate((el: any) => el.textContent?.trim())
    
    const remoteEl = await card.$('[data-testid="remote-type"], .remoteType, .remote')
    const remoteType = await remoteEl?.evaluate((el: any) => el.textContent?.trim())
    
    const externalId = this.extractJobId(url)
    
    let description = ''
    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        await this.randomDelay(500, 1500)
        const descEl = await page.$('#jobDescriptionText, .jobsearch-jobDescriptionText, .jobDescriptionText, [data-testid="job-description"]')
        description = await descEl?.evaluate((el: any) => el.textContent?.trim()) || ''
      } catch {
        description = ''
      }
    }
    
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
  
  private extractJobId(url: string): string {
    const match = url.match(/\/jobs\/([a-f0-9]+)/) || url.match(/[?&]jk=([a-f0-9]+)/) || url.match(/jk=([a-f0-9]+)/)
    return match?.[1] || url
  }
  
  private parseSalary(text?: string): { min?: number; max?: number } {
    if (!text) return {}
    const numbers = text.match(/[\d\s]+/g)?.map(n => parseInt(n.replace(/\s/g, ''))) || []
    if (numbers.length >= 2) return { min: numbers[0], max: numbers[1] }
    if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
    return {}
  }
}
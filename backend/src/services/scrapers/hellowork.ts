import { BaseScraper, ScrapedJob, SearchOptions } from '../scraper.js'
import type { Page } from 'puppeteer'

export class HelloWorkScraper extends BaseScraper {
  protected source = 'HELLOWORK' as const
  protected baseUrl = 'https://www.hellowork.com'
  
  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const page = await this.createPage()
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 3
    
    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const searchUrl = `${this.baseUrl}/fr-fr/emploi/recherche.html?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&p=${pageNum}`
        
        console.log(`[HELLOWORK] Fetching page ${pageNum}: ${searchUrl}`)
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        await this.randomDelay()
        
        // Try multiple selectors for HelloWork
        let jobCards = await page.$$('.job-offer, .offer-item, [data-testid="job-offer"], .tw-border.tw-rounded-lg, .job-card, .job-result, .offer-card')
        
        if (jobCards.length === 0) {
          console.log(`[HELLOWORK] No job cards found on page ${pageNum}, trying alternative selectors`)
          jobCards = await page.$$('.job-offer-item, .result-item, [data-offer-id], .job-listing')
        }
        
        if (jobCards.length === 0) {
          console.log(`[HELLOWORK] Still no job cards found on page ${pageNum}`)
          const pageContent = await page.content()
          console.log(`[HELLOWORK] Page content length: ${pageContent.length}`)
          break
        }
        
        console.log(`[HELLOWORK] Found ${jobCards.length} job cards on page ${pageNum}`)
        
        for (const card of jobCards) {
          try {
            const job = await this.extractJobFromCard(page, card)
            if (job) jobs.push(job)
          } catch (error) {
            console.error('[HELLOWORK] Error extracting job:', error)
          }
        }
        
        const nextButton = await page.$('a[rel="next"], .pagination-next, .pagination a:last-child')
        if (!nextButton) break
      }
    } finally {
      await page.close()
    }
    
    console.log(`[HELLOWORK] Total jobs found: ${jobs.length}`)
    return jobs
  }
  
  private async extractJobFromCard(page: Page, card: any): Promise<ScrapedJob | null> {
    // Try multiple selectors for title
    let titleEl = await card.$('h3 a, h2 a, .job-title a, [data-testid="job-title"], .job-title, .offer-title a, h3, h2')
    let title = await titleEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!title) {
      titleEl = await card.$('.title, .job-title, [title], h3 a, h2 a')
      title = await titleEl?.evaluate((el: any) => el.textContent?.trim())
    }
    
    if (!title) return null
    
    const linkEl = await card.$('h3 a, h2 a, .job-title a, [data-testid="job-title"], .offer-title a, a[href*="/offre-emploi/"]')
    const href = await linkEl?.evaluate((el: any) => el.getAttribute('href'))
    const url = href?.startsWith('http') ? href : `${this.baseUrl}${href}`
    
    // Try multiple selectors for company
    let companyEl = await card.$('.company-name, .job-company, [data-testid="company-name"], .company, .companyName')
    let company = await companyEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!company || company === 'Unknown') {
      companyEl = await card.$('.company, .employer, .entreprise, [data-company-name]')
      company = await companyEl?.evaluate((el: any) => el.textContent?.trim()) || 'Unknown'
    }
    
    // Try multiple selectors for location
    let locationEl = await card.$('.job-location, .location, [data-testid="job-location"], .job-location, .lieu')
    let location = await locationEl?.evaluate((el: any) => el.textContent?.trim())
    
    if (!location) {
      locationEl = await card.$('.location, .job-location, [data-testid="job-location"]')
      location = await locationEl?.evaluate((el: any) => el.textContent?.trim()) || ''
    }
    
    const salaryEl = await card.$('.salary, .job-salary, [data-testid="salary"], .salaire, .remuneration')
    const salaryText = await salaryEl?.evaluate((el: any) => el.textContent?.trim())
    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryText)
    
    const typeEl = await card.$('.contract-type, .job-type, [data-testid="contract-type"], .type-contrat, .contrat')
    const contractType = await typeEl?.evaluate((el: any) => el.textContent?.trim())
    
    const externalId = this.extractJobId(url)
    
    let description = ''
    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        await this.randomDelay(500, 1500)
        const descEl = await page.$('.job-description, .offer-description, [data-testid="job-description"], .description, .job-detail')
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
      postedAt: new Date(),
    }
  }
  
  private extractJobId(url: string): string {
    const match = url.match(/\/offre-emploi\/([^/]+)/) || url.match(/[?&]id=(\d+)/) || url.match(/offre-emploi\/([^\/]+)/)
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
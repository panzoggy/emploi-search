import { BaseScraper, ScrapedJob, SearchOptions } from '../scraper.js'
import type { Page } from 'puppeteer'

export class LinkedInScraper extends BaseScraper {
  protected source = 'LINKEDIN' as const
  protected baseUrl = 'https://www.linkedin.com'
  
  async search(query: string, location: string, options: SearchOptions = {}): Promise<ScrapedJob[]> {
    const page = await this.createPage()
    const jobs: ScrapedJob[] = []
    const maxPages = options.maxPages || 2
    
    try {
      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        const start = pageNum * 25
        const searchUrl = `${this.baseUrl}/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}`
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        await this.randomDelay(2000, 4000)
        
        const jobCards = await page.$$('.base-card, .job-card-container, li[data-entity-urn]')
        
        if (jobCards.length === 0) break
        
        for (const card of jobCards) {
          try {
            const job = await this.extractJobFromCard(page, card)
            if (job) jobs.push(job)
          } catch (error) {
            console.error('Error extracting LinkedIn job:', error)
          }
        }
        
        await this.randomDelay(1000, 2000)
      }
    } finally {
      await page.close()
    }
    
    return jobs
  }
  
  private async extractJobFromCard(page: Page, card: any): Promise<ScrapedJob | null> {
    const titleEl = await card.$('h3 a, h3 span, .base-search-card__title')
    const title = await titleEl?.evaluate((el: any) => el.textContent?.trim())
    if (!title) return null
    
    const linkEl = await card.$('h3 a, .base-card__full-link, a[data-tracking-control-name]')
    const href = await linkEl?.evaluate((el: any) => el.getAttribute('href'))
    const url = href?.split('?')[0] || ''
    
    const companyEl = await card.$('h4 a, .base-search-card__subtitle, [data-tracking-control-name="public_jobs_topcard-org-name"]')
    const company = await companyEl?.evaluate((el: any) => el.textContent?.trim()) || 'Unknown'
    
    const locationEl = await card.$('.job-search-card__location, .base-search-card__metadata span')
    const location = await locationEl?.evaluate((el: any) => el.textContent?.trim()) || ''
    
    const externalId = this.extractJobId(url)
    
    let description = ''
    let salaryMin: number | undefined
    let salaryMax: number | undefined
    let contractType: string | undefined
    
    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        await this.randomDelay(1000, 2000)
        
        const descEl = await page.$('.show-more-less-html__markup, .description__text, .jobs-description__content')
        description = await descEl?.evaluate((el: any) => el.textContent?.trim()) || ''
        
        const salaryEl = await page.$('.salary, .compensation__salary, [data-test="job-salary"]')
        const salaryText = await salaryEl?.evaluate((el: any) => el.textContent?.trim())
        const parsed = this.parseSalary(salaryText)
        salaryMin = parsed.min
        salaryMax = parsed.max
        
        const typeEl = await page.$('.job-criteria__item:has-text("Type") .job-criteria__text, [data-test="job-type"]')
        contractType = await typeEl?.evaluate((el: any) => el.textContent?.trim())
        
      } catch {
        // Ignore errors for detail page
      }
    }
    
    return {
      externalId,
      source: this.source,
      title,
      company,
      location,
      description,
      url: url || `${this.baseUrl}/jobs/view/${externalId}`,
      salaryMin,
      salaryMax,
      contractType,
      postedAt: new Date(),
    }
  }
  
  private extractJobId(url: string): string {
    const match = url.match(/\/jobs\/view\/(\d+)/) || url.match(/\/jobs\/(\d+)/) || url.match(/currentJobId=(\d+)/)
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
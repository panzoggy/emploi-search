import { BaseScraper, ScrapedJob, SearchOptions } from '../scraper.js'

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
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        await this.randomDelay()
        
        const jobCards = await page.$$('.job-offer, .offer-item, [data-testid="job-offer"]')
        
        if (jobCards.length === 0) {
          const altCards = await page.$$('.tw-border.tw-rounded-lg, .job-card')
          if (altCards.length === 0) break
          for (const card of altCards) {
            try {
              const job = await this.extractJobFromCard(page, card)
              if (job) jobs.push(job)
            } catch (error) {
              console.error('Error extracting HelloWork job:', error)
            }
          }
          continue
        }
        
        for (const card of jobCards) {
          try {
            const job = await this.extractJobFromCard(page, card)
            if (job) jobs.push(job)
          } catch (error) {
            console.error('Error extracting HelloWork job:', error)
          }
        }
        
        const nextButton = await page.$('a[rel="next"], .pagination-next')
        if (!nextButton) break
      }
    } finally {
      await page.close()
    }
    
    return jobs
  }
  
  private async extractJobFromCard(page: Page, card: any): Promise<ScrapedJob | null> {
    const titleEl = await card.$('h3 a, h2 a, .job-title a, [data-testid="job-title"]')
    const title = await titleEl?.evaluate(el => el.textContent?.trim())
    if (!title) return null
    
    const linkEl = await card.$('h3 a, h2 a, .job-title a, [data-testid="job-title"]')
    const href = await linkEl?.evaluate(el => el.getAttribute('href'))
    const url = href?.startsWith('http') ? href : `${this.baseUrl}${href}`
    
    const companyEl = await card.$('.company-name, .job-company, [data-testid="company-name"]')
    const company = await companyEl?.evaluate(el => el.textContent?.trim()) || 'Unknown'
    
    const locationEl = await card.$('.job-location, .location, [data-testid="job-location"]')
    const location = await locationEl?.evaluate(el => el.textContent?.trim()) || ''
    
    const salaryEl = await card.$('.salary, .job-salary, [data-testid="salary"]')
    const salaryText = await salaryEl?.evaluate(el => el.textContent?.trim())
    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryText)
    
    const typeEl = await card.$('.contract-type, .job-type, [data-testid="contract-type"]')
    const contractType = await typeEl?.evaluate(el => el.textContent?.trim())
    
    const externalId = this.extractJobId(url)
    
    let description = ''
    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
        await this.randomDelay(500, 1500)
        const descEl = await page.$('.job-description, .offer-description, [data-testid="job-description"]')
        description = await descEl?.evaluate(el => el.textContent?.trim()) || ''
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
    const match = url.match(/\/offre-emploi\/([^/]+)/) || url.match(/[?&]id=(\d+)/)
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
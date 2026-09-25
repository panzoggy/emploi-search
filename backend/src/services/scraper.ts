import puppeteer, { Browser, Page } from 'puppeteer'
import { prisma, JobSource } from '../index.js'
import { AppError } from '../middleware/errorHandler.js'

export interface ScrapedJob {
  externalId: string
  source: JobSource
  title: string
  company: string
  location: string
  description: string
  url: string
  salaryMin?: number
  salaryMax?: number
  contractType?: string
  experienceLevel?: string
  remoteType?: string
  postedAt?: Date
}

export abstract class BaseScraper {
  protected browser: Browser | null = null
  protected abstract source: JobSource
  protected abstract baseUrl: string
  
  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    })
  }
  
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
  
  protected async createPage(): Promise<Page> {
    if (!this.browser) throw new AppError(500, 'Browser not initialized')
    const page = await this.browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1366, height: 768 })
    return page
  }
  
  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  abstract search(query: string, location: string, options?: SearchOptions): Promise<ScrapedJob[]>
  
  protected async saveJobs(jobs: ScrapedJob[], searchId?: string): Promise<number> {
    let saved = 0
    for (const job of jobs) {
      try {
        await prisma.job.upsert({
          where: {
            externalId_source: {
              externalId: job.externalId,
              source: job.source,
            },
          },
          update: {
            ...job,
            searchId,
          },
          create: {
            ...job,
            searchId,
          },
        })
        saved++
      } catch (error) {
        console.error(`Failed to save job ${job.externalId}:`, error)
      }
    }
    return saved
  }
}

export interface SearchOptions {
  contractTypes?: string[]
  remoteOnly?: boolean
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  maxPages?: number
}

export async function createScraper(source: JobSource): Promise<BaseScraper> {
  switch (source) {
    case 'INDEED':
      const { IndeedScraper } = await import('./scrapers/indeed.js')
      return new IndeedScraper()
    case 'HELLOWORK':
      const { HelloWorkScraper } = await import('./scrapers/hellowork.js')
      return new HelloWorkScraper()
    case 'LINKEDIN':
      const { LinkedInScraper } = await import('./scrapers/linkedin.js')
      return new LinkedInScraper()
    default:
      throw new AppError(400, `Unknown source: ${source}`)
  }
}

export async function scrapeAllSources(
  query: string,
  location: string,
  options: SearchOptions = {}
): Promise<{ source: JobSource; jobs: ScrapedJob[]; error?: string }[]> {
  const sources: JobSource[] = options.sources || ['INDEED', 'HELLOWORK', 'LINKEDIN']
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const scraper = await createScraper(source)
      await scraper.init()
      try {
        const jobs = await scraper.search(query, location, options)
        return { source, jobs }
      } finally {
        await scraper.close()
      }
    })
  )
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      source: sources[index],
      jobs: [],
      error: result.reason?.message || 'Unknown error',
    }
  })
}
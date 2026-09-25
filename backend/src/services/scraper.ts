import axios from 'axios'
import { prisma } from '../index.js'
import { AppError } from '../middleware/errorHandler.js'

export type JobSource = 'INDEED' | 'HELLOWORK' | 'LINKEDIN'

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

// Shared HTTP client with realistic browser headers
export const httpClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
})

export abstract class BaseScraper {
  protected abstract source: JobSource
  protected abstract baseUrl: string

  protected async randomDelay(min = 500, max = 1500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  protected parseSalary(text?: string): { min?: number; max?: number } {
    if (!text) return {}
    // Match numbers like 45 000, 45000, 45k, 45K
    const normalized = text.replace(/\s/g, '').replace(/[kK]€?/g, '000')
    const numbers = normalized.match(/\d{4,6}/g)?.map(Number) || []
    if (numbers.length >= 2) return { min: numbers[0], max: numbers[1] }
    if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
    return {}
  }

  abstract search(query: string, location: string, options?: SearchOptions): Promise<ScrapedJob[]>
}

export interface SearchOptions {
  contractTypes?: string[]
  remoteOnly?: boolean
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  maxPages?: number
  sources?: JobSource[]
}

export async function createScraper(source: JobSource): Promise<BaseScraper> {
  switch (source) {
    case 'INDEED': {
      const { IndeedScraper } = await import('./scrapers/indeed.js')
      return new IndeedScraper()
    }
    case 'HELLOWORK': {
      const { HelloWorkScraper } = await import('./scrapers/hellowork.js')
      return new HelloWorkScraper()
    }
    case 'LINKEDIN': {
      const { LinkedInScraper } = await import('./scrapers/linkedin.js')
      return new LinkedInScraper()
    }
    default:
      throw new AppError(400, `Unknown source: ${source}`)
  }
}

export async function scrapeAllSources(
  query: string,
  location: string,
  options: SearchOptions = {}
): Promise<{ source: JobSource; jobs: ScrapedJob[]; error?: string }[]> {
  console.log('[SCRAPER] Starting scrape for:', { query, location, sources: options.sources })
  const sources: JobSource[] = options.sources || ['INDEED', 'HELLOWORK', 'LINKEDIN']

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      console.log(`[SCRAPER] Starting ${source} scraper`)
      const scraper = await createScraper(source)
      try {
        const jobs = await scraper.search(query, location, options)
        console.log(`[SCRAPER] ${source} found ${jobs.length} jobs`)
        return { source, jobs }
      } catch (err) {
        console.error(`[SCRAPER] ${source} error:`, err)
        throw err
      }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    const error = result.reason?.message || 'Unknown error'
    console.error(`[SCRAPER] ${sources[index]} failed:`, error)
    return { source: sources[index], jobs: [], error }
  })
}

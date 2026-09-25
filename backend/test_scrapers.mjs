import axios from './node_modules/axios/dist/node/axios.cjs'
import * as cheerio from './node_modules/cheerio/lib/index.js'

async function testIndeed() {
  try {
    const url = 'https://fr.indeed.com/jobs?q=developpeur&l=Paris&lang=fr'
    console.log('[TEST] Fetching:', url)
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('[TEST] Status:', resp.status, '| Content length:', resp.data.length)
    const title = $('title').text()
    console.log('[TEST] Title:', title)
    console.log('[TEST] Cards [data-jk]:', $('[data-jk]').length)
    console.log('[TEST] Cards .job_seen_beacon:', $('.job_seen_beacon').length)
    console.log('[TEST] Cards .result:', $('.result').length)
    console.log('[TEST] Cards td.resultContent:', $('td.resultContent').length)
    console.log('[TEST] HTML snippet (first 3000):\n', resp.data.substring(0, 3000))
  } catch(e) {
    console.error('[TEST] Error:', e.message, e.response?.status, e.response?.data?.substring(0,500))
  }
}

async function testLinkedIn() {
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=developpeur&location=Paris&start=0'
    console.log('\n[TEST LINKEDIN] Fetching:', url)
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('[TEST LINKEDIN] Status:', resp.status, '| Length:', resp.data.length)
    console.log('[TEST LINKEDIN] li count:', $('li').length)
    console.log('[TEST LINKEDIN] .base-card:', $('.base-card').length)
    console.log('[TEST LINKEDIN] h3:', $('h3').length, '- first:', $('h3').first().text().trim())
    console.log('[TEST LINKEDIN] snippet:\n', resp.data.substring(0, 2000))
  } catch(e) {
    console.error('[TEST LINKEDIN] Error:', e.message, e.response?.status)
  }
}

async function testHelloWork() {
  try {
    const url = 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=developpeur&l=Paris&p=1'
    console.log('\n[TEST HELLOWORK] Fetching:', url)
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('[TEST HELLOWORK] Status:', resp.status, '| Length:', resp.data.length)
    console.log('[TEST HELLOWORK] [data-id-offre]:', $('[data-id-offre]').length)
    console.log('[TEST HELLOWORK] li count:', $('li').length)
    console.log('[TEST HELLOWORK] article count:', $('article').length)
    console.log('[TEST HELLOWORK] snippet:\n', resp.data.substring(0, 2000))
  } catch(e) {
    console.error('[TEST HELLOWORK] Error:', e.message, e.response?.status)
  }
}

await testIndeed()
await testLinkedIn()
await testHelloWork()

import axios from 'axios'
import * as cheerio from 'cheerio'

async function testIndeed() {
  console.log('\n=== TEST INDEED ===')
  try {
    const url = 'https://fr.indeed.com/jobs?q=developpeur&l=Paris&lang=fr'
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('Status:', resp.status, '| Length:', resp.data.length)
    console.log('Title:', $('title').text().substring(0,80))
    console.log('[data-jk]:', $('[data-jk]').length)
    console.log('.job_seen_beacon:', $('.job_seen_beacon').length)
    console.log('.result:', $('.result').length)
    console.log('h2.jobTitle:', $('h2.jobTitle').length)
    // look for any job-like elements
    const allLinks = $('a[href*="viewjob"], a[href*="/jobs/view"]').length
    console.log('job links:', allLinks)
    // print first 500 chars of body text
    console.log('--- HTML snippet ---')
    console.log(resp.data.substring(0, 1500))
  } catch(e) {
    console.error('FAILED:', e.message, '| HTTP:', e.response?.status)
    if (e.response?.data) console.log('Response:', String(e.response.data).substring(0,500))
  }
}

async function testLinkedIn() {
  console.log('\n=== TEST LINKEDIN ===')
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=developpeur&location=Paris&start=0'
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('Status:', resp.status, '| Length:', resp.data.length)
    console.log('li count:', $('li').length)
    console.log('h3 count:', $('h3').length, '| first h3:', $('h3').first().text().trim().substring(0,60))
    console.log('.base-card:', $('.base-card').length)
    console.log('--- HTML snippet ---')
    console.log(resp.data.substring(0, 1500))
  } catch(e) {
    console.error('FAILED:', e.message, '| HTTP:', e.response?.status)
  }
}

async function testHelloWork() {
  console.log('\n=== TEST HELLOWORK ===')
  try {
    const url = 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=developpeur&l=Paris&p=1'
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    })
    const $ = cheerio.load(resp.data)
    console.log('Status:', resp.status, '| Length:', resp.data.length)
    console.log('[data-id-offre]:', $('[data-id-offre]').length)
    console.log('li count:', $('li').length)
    console.log('article count:', $('article').length)
    console.log('--- HTML snippet ---')
    console.log(resp.data.substring(0, 1500))
  } catch(e) {
    console.error('FAILED:', e.message, '| HTTP:', e.response?.status)
    if (e.response?.data) console.log('Response:', String(e.response.data).substring(0,500))
  }
}

await testIndeed()
await testLinkedIn()
await testHelloWork()

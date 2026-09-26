import { chromium, type Browser, type Page } from 'playwright-core'
import { errorMessage, logger } from '../shared/logger.js'

// Navigateur réel pour les sites protégés par Cloudflare (Indeed).
// Chrome headless est détecté et bloqué : on lance un Chrome "avec écran" sur l'écran
// virtuel Xvfb démarré par le conteneur (voir le CMD du Dockerfile).
export interface BrowserSession {
  page: Page
  close(): Promise<void>
}

export async function openBrowser(): Promise<BrowserSession> {
  if (!process.env.DISPLAY) {
    throw new Error('Aucun écran virtuel (DISPLAY) : Indeed nécessite le conteneur Docker du backend')
  }
  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })
  try {
    const context = await browser.newContext({ locale: 'fr-FR', timezoneId: 'Europe/Paris' })
    return {
      page: await context.newPage(),
      close: () =>
        browser.close().catch((err: unknown) => logger.warn(`Fermeture du navigateur : ${errorMessage(err)}`)),
    }
  } catch (error) {
    await browser.close()
    throw error
  }
}

export type PageState = 'ready' | 'blocked' | 'login' | 'empty'

// Attend le contenu voulu, ou reconnaît un blocage anti-bot / un mur de connexion
export async function waitForContent(page: Page, selector: string, timeoutMs = 20_000): Promise<PageState> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await page.locator(selector).count()) > 0) return 'ready'
    const title = await page.title()
    if (/blocked|bloqu/i.test(title)) return 'blocked'
    if (/connexion|sign in|log in/i.test(title)) return 'login'
    await page.waitForTimeout(800)
  }
  return /security check|just a moment/i.test(await page.title()) ? 'blocked' : 'empty'
}

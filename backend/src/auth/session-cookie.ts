import type { Request, Response } from 'express'
import { SESSION_DAYS } from './sessions.js'

export const COOKIE_NAME = 'emploi_session'

export function readSessionCookie(req: Request): string | undefined {
  const header = req.headers.cookie ?? ''
  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === COOKIE_NAME) return decodeURIComponent(value.join('='))
  }
  return undefined
}

// httpOnly : inaccessible au JavaScript de la page. Secure dès qu'on est derrière HTTPS (Cloudflare).
export function writeSessionCookie(req: Request, res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_DAYS * 86_400_000,
    path: '/',
  })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

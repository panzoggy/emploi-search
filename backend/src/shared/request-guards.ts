import type { NextFunction, Request, Response } from 'express'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Contre le CSRF : une requête qui modifie des données doit venir de la page de l'application elle-même.
// Complète le cookie SameSite=Lax (utile si un autre site partage le même domaine parent).
export function sameOriginOnly(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next()
  // Noms d'hôte sans port : nginx transmet Host sans le port d'écoute
  const expected = (req.headers.host ?? '').split(':')[0]
  if (!expected || hostnameOf(req.headers.origin ?? req.headers.referer) !== expected) {
    res.status(403).json({ error: 'Requête refusée : origine inconnue' })
    return
  }
  next()
}

function hostnameOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

// Les réponses de l'API sont propres à chaque compte : ni le navigateur ni Cloudflare ne doivent les garder
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'private, no-store')
  next()
}

import type { Request } from 'express'

// Derrière Cloudflare, tous les visiteurs arrivent par le tunnel : la vraie adresse est dans CF-Connecting-IP
export function clientIp(req: Request): string {
  const cloudflare = req.headers['cf-connecting-ip']
  return (Array.isArray(cloudflare) ? cloudflare[0] : cloudflare) ?? req.ip ?? 'inconnue'
}

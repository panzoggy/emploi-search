import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { sameOriginOnly } from './request-guards.js'

const run = (method: string, headers: Record<string, string>) => {
  const next = vi.fn<NextFunction>()
  const status = vi.fn().mockReturnValue({ json: vi.fn() })
  sameOriginOnly({ method, headers } as unknown as Request, { status } as unknown as Response, next) // objets factices
  return next.mock.calls.length === 1 ? 'passe' : 'refusée'
}

describe('protection CSRF', () => {
  it('laisse passer les lectures', () => {
    expect(run('GET', { host: 'emploi.test' })).toBe('passe')
  })
  it('accepte une modification venant de la page elle-même, même sur un autre port', () => {
    expect(run('POST', { host: 'emploi.test', origin: 'http://emploi.test:8080' })).toBe('passe')
  })
  it("refuse une modification venant d'un autre site", () => {
    expect(run('POST', { host: 'emploi.test', origin: 'https://attaquant.test' })).toBe('refusée')
  })
  it('refuse une modification sans origine', () => {
    expect(run('DELETE', { host: 'emploi.test' })).toBe('refusée')
  })
})

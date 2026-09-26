import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('mots de passe', () => {
  it('vérifie le bon mot de passe et refuse les autres', async () => {
    const stored = await hashPassword('correct horse battery')
    expect(await verifyPassword('correct horse battery', stored)).toBe(true)
    expect(await verifyPassword('correct horse batterie', stored)).toBe(false)
  })
  it('sale chaque empreinte : deux comptes au même mot de passe ont des empreintes différentes', async () => {
    expect(await hashPassword('identique')).not.toBe(await hashPassword('identique'))
  })
  it('refuse une empreinte illisible sans planter', async () => {
    expect(await verifyPassword('peu importe', 'n-importe-quoi')).toBe(false)
  })
  it('ne stocke jamais le mot de passe en clair', async () => {
    expect(await hashPassword('secret-visible')).not.toContain('secret-visible')
  })
})

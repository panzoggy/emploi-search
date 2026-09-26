import { randomBytes } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { seal, sealText, unseal, unsealText } from './sealed-data.js'

beforeAll(() => {
  process.env.DATA_KEY = randomBytes(32).toString('base64')
})

describe('chiffrement au repos', () => {
  it('rend le texte illisible et le restitue à son propriétaire', () => {
    const sealed = sealText('Camille Martin, 06 12 34 56 78', 'alice')
    expect(sealed).not.toContain('Camille')
    expect(unsealText(sealed, 'alice')).toBe('Camille Martin, 06 12 34 56 78')
  })
  it('refuse de déchiffrer pour un autre compte', () => {
    const sealed = seal(Buffer.from('%PDF-1.7 cv'), 'alice')
    expect(() => unseal(sealed, 'bob')).toThrow()
  })
  it('détecte une donnée modifiée', () => {
    const sealed = seal(Buffer.from('%PDF-1.7 cv'), 'alice')
    sealed[sealed.length - 1] ^= 1
    expect(() => unseal(sealed, 'alice')).toThrow()
  })
  it('laisse passer les données écrites avant le chiffrement', () => {
    expect(unsealText('ancien texte', 'alice')).toBe('ancien texte')
  })
})

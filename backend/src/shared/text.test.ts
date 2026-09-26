import { describe, expect, it } from 'vitest'
import { containsTerm, fingerprint, normalize } from './text.js'

describe('texte', () => {
  it('reconnaît la même offre écrite différemment sur deux sites', () => {
    expect(fingerprint('Développeur React (H/F)', 'ACME SAS')).toBe(fingerprint('Developpeur React - H/F', 'Acme SAS'))
  })
  it('cherche des termes en mots entiers', () => {
    const text = normalize('Stack : Node.js, C++ et Power BI. Java apprécié.')
    expect(containsTerm(text, 'node.js')).toBe(true)
    expect(containsTerm(text, 'C++')).toBe(true)
    expect(containsTerm(text, 'power bi')).toBe(true)
    expect(containsTerm(text, 'javascript')).toBe(false)
  })
})

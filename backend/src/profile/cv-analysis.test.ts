import { describe, expect, it } from 'vitest'
import { analyzeCv } from './cv-analysis.js'

const CV = `Camille Martin
Développeuse Front-end React
12 rue des Lilas, 69003 Lyon
camille@example.com · 06 12 34 56 78

Expériences professionnelles
Développeuse React – Acme (2021 – aujourd'hui)
Intégratrice web chez Studio Nord, 2018 - 2021
Prise en charge des maquettes Figma, TypeScript, tests Jest.

Formation
Master informatique 2016 - 2018

Compétences
React, TypeScript, Node.js, Git, anglais courant. C'est un plaisir de coder.`

describe('analyzeCv', () => {
  const result = analyzeCv(CV)
  it('propose les intitulés de poste, sans les phrases de description', () => {
    expect(result.targetTitles).toEqual(['Développeuse Front-end React', 'Développeuse React', 'Intégratrice web'])
  })
  it('extrait les compétences connues sans faux positif sur "c\'est"', () => {
    expect(result.skills).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Node.js', 'Git', 'Figma', 'Anglais']))
    expect(result.skills).not.toContain('C')
  })
  it("trouve la ville de l'en-tête", () => {
    expect(result.locations).toEqual(['Lyon'])
  })
  it("compte l'expérience hors formation", () => {
    expect(result.yearsOfExperience).toBe(new Date().getFullYear() - 2018)
  })
})

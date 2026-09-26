// Normalisation commune à la déduplication, au matching et à l'extraction du CV
export const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim()

const STOPWORDS = new Set([
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'l',
  'd',
  'un',
  'une',
  'et',
  'ou',
  'en',
  'a',
  'au',
  'aux',
  'pour',
  'par',
  'sur',
  'avec',
  'dans',
  'h',
  'f',
  'hf',
  'fh',
  'x',
  'm',
  'the',
  'of',
  'and',
  'for',
  'in',
  'cdi',
  'cdd',
])

export const tokens = (text: string): string[] =>
  normalize(text)
    .split(/[^a-z0-9+#.]+/)
    .map(t => t.replace(/\.+$/, ''))
    .filter(t => t.length > 1 && !STOPWORDS.has(t))

// Recherche d'un terme en mot entier (gère "c++", "node.js", "power bi"…)
export const containsTerm = (normalizedHaystack: string, term: string): boolean => {
  const needle = normalize(term)
  if (!needle) return false
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9+#])`).test(normalizedHaystack)
}

// "Développeur React (H/F) - CDI" et "Développeur React H/F" doivent donner la même empreinte
export const fingerprint = (title: string, company: string): string =>
  `${tokens(title.replace(/\(?\b[hf]\s*\/\s*[hf]\b\)?/gi, '')).join(' ')}|${tokens(company).join(' ')}`

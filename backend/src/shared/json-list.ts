// Listes stockées en JSON dans des colonnes texte (SQLite n'a pas de tableaux)
export const parseList = (value: string | null | undefined): string[] => {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export const toJsonList = (values: string[]): string =>
  JSON.stringify([...new Set(values.map(v => v.trim()).filter(Boolean))])

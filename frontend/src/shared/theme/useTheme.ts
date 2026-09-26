import { useCallback, useState } from 'react'

export type Theme = 'dark' | 'light'

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(current)
  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Stockage indisponible (navigation privée) : le thème vaut pour la session
    }
    setTheme(next)
  }, [])
  return { theme, toggle }
}

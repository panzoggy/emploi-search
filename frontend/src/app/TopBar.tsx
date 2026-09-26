import { NavLink } from 'react-router-dom'
import { cn } from '../shared/lib/cn'
import { useAuth } from '../auth'
import { useTheme } from '../shared/theme/useTheme'

const LINKS = [
  { to: '/', label: 'Offres' },
  { to: '/recherches', label: 'Recherches' },
  { to: '/profil', label: 'Profil' },
]

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-stretch border-b border-rule bg-canvas px-4 lg:px-6">
      <NavLink
        to="/"
        className="flex items-center gap-2.5 pr-6 text-[13px] font-bold uppercase tracking-[0.14em] text-fg"
      >
        <span className="h-3 w-3 bg-accent" aria-hidden />
        <span className="hidden sm:inline">Emploi</span>
      </NavLink>
      <nav className="flex items-stretch gap-5" aria-label="Navigation principale">
        {LINKS.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <Account />
      </div>
    </header>
  )
}

// Onglet actif : un filet d'encre posé sur la bordure du bandeau
const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    '-mb-px flex items-center border-b-2 text-sm transition-colors duration-150 ease-swiss',
    isActive ? 'border-fg text-fg' : 'border-transparent text-fg-2 hover:text-fg',
  )

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className="label px-2 py-1 hover:text-fg">
      {theme === 'dark' ? 'Clair' : 'Sombre'}
    </button>
  )
}

function Account() {
  const { state, logout } = useAuth()
  if (state.status !== 'signed-in') return null
  return (
    <div className="flex items-center gap-3 border-l border-rule pl-4">
      <span className="hidden font-mono text-xs text-fg-2 sm:inline">{state.username}</span>
      <button onClick={() => void logout()} className="label px-1 py-1 hover:text-fg">
        Déconnexion
      </button>
    </div>
  )
}

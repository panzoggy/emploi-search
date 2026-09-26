import { useEffect, useRef, useState, type RefObject } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../shared/lib/cn'
import { Kbd } from '../shared/ui/Kbd'
import { Segmented } from '../shared/ui/Segmented'
import { activeFilterCount, CONTRACT_OPTIONS, type FeedFilters, type RemoteFilter, type SortOrder } from './feed-query'
import { MultiFilter, SingleFilter } from './FilterMenu'
import { SOURCE_LABELS, SOURCES } from './types'

interface FilterBarProps {
  filters: FeedFilters
  sort: SortOrder
  setFilter: <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => void
  setSort: (sort: SortOrder) => void
  reset: () => void
}

const REMOTE_CHOICES: { value: RemoteFilter | null; label: string }[] = [
  { value: null, label: 'Peu importe' },
  { value: 'hybrid', label: 'Au moins partiel' },
  { value: 'full', label: 'Complet uniquement' },
]
const SCORE_CHOICES = [null, 50, 60, 70, 80].map(v => ({ value: v, label: v ? `${v} et plus` : 'Tous les scores' }))
const AGE_CHOICES = [null, 1, 7, 14, 30].map(v => ({
  value: v,
  label: v ? (v === 1 ? 'Dernières 24 h' : `Moins de ${v} jours`) : 'Toutes les dates',
}))
const SOURCE_CHOICES = SOURCES.map(s => ({ value: s, label: SOURCE_LABELS[s] }))
const CONTRACT_CHOICES = CONTRACT_OPTIONS.map(c => ({ value: c, label: c }))
const SORT_OPTIONS = [
  { value: 'score' as const, label: 'Pertinence' },
  { value: 'date' as const, label: 'Date' },
]

export function FilterBar({ filters, sort, setFilter, setSort, reset }: FilterBarProps) {
  const active = activeFilterCount(filters)
  return (
    <div
      className={cn(
        'scrollbar-none flex items-center gap-1 overflow-x-auto overflow-y-hidden',
        // Téléphone : défilement au doigt ; au-delà, retour à la ligne plutôt qu'un tri caché hors champ
        'sm:flex-wrap sm:gap-y-2 sm:overflow-visible',
        'border-b border-rule px-4 py-2 lg:px-6',
      )}
    >
      <SearchInput value={filters.q} onChange={q => setFilter('q', q)} />
      <span className="mx-2 h-5 w-px shrink-0 bg-rule" aria-hidden />
      <FilterMenus filters={filters} setFilter={setFilter} />
      {active > 0 && (
        <button
          type="button"
          onClick={reset}
          className="ml-1 shrink-0 px-2 text-xs text-fg-2 underline-offset-4 hover:text-fg hover:underline"
        >
          Effacer les filtres
        </button>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-3 pl-4">
        <span className="label hidden xl:inline">Tri</span>
        <Segmented label="Tri" value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>
    </div>
  )
}

type FilterMenusProps = Pick<FilterBarProps, 'filters' | 'setFilter'>

const FilterMenus = (props: FilterMenusProps) => (
  <>
    <ScopeFilters {...props} />
    <ConditionFilters {...props} />
  </>
)

function ScopeFilters({ filters, setFilter }: FilterMenusProps) {
  return (
    <>
      <MultiFilter
        label="Source"
        choices={SOURCE_CHOICES}
        values={filters.sources}
        onChange={v => setFilter('sources', v)}
      />
      <MultiFilter
        label="Contrat"
        choices={CONTRACT_CHOICES}
        values={filters.contracts}
        onChange={v => setFilter('contracts', v)}
      />
    </>
  )
}

function ConditionFilters({ filters, setFilter }: FilterMenusProps) {
  return (
    <>
      <SingleFilter
        label="Télétravail"
        choices={REMOTE_CHOICES}
        value={filters.remote}
        onChange={v => setFilter('remote', v)}
      />
      <SingleFilter
        label="Score"
        choices={SCORE_CHOICES}
        value={filters.minScore}
        summary={filters.minScore ? `≥ ${filters.minScore}` : null}
        onChange={v => setFilter('minScore', v)}
      />
      <SingleFilter
        label="Publiée"
        choices={AGE_CHOICES}
        value={filters.maxAgeDays}
        onChange={v => setFilter('maxAgeDays', v)}
      />
    </>
  )
}

// Recherche dans les intitulés et entreprises ; "/" pour y aller au clavier. Saisie temporisée.
function SearchInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useDebouncedText(value, onChange)
  useSlashFocus(input)
  return (
    <label
      className={cn(
        'flex h-8 w-40 shrink-0 items-center gap-2 border border-rule-strong px-2.5',
        'focus-within:border-fg sm:w-56',
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-fg-3" aria-hidden />
      <input
        ref={input}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && e.currentTarget.blur()}
        placeholder="Intitulé, entreprise"
        aria-label="Rechercher dans les offres"
        className="min-w-0 flex-1 bg-transparent text-xs text-fg placeholder:text-fg-3 focus:outline-none"
      />
      {!text && <Kbd>/</Kbd>}
    </label>
  )
}

// Saisie locale immédiate, transmise après 300 ms sans frappe
function useDebouncedText(value: string, onChange: (text: string) => void) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onChange(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text, value, onChange])
  return [text, setText] as const
}

// "/" place le curseur dans la recherche, sauf si on tape déjà dans un champ
function useSlashFocus(input: RefObject<HTMLInputElement>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || document.activeElement?.tagName === 'INPUT') return
      e.preventDefault()
      input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [input])
}

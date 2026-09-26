import { compactAge } from '../shared/lib/format'
import { EmptyState } from '../shared/ui/EmptyState'
import { Skeleton } from '../shared/ui/Skeleton'
import { ActiveSearches } from './ActiveSearches'
import { SearchLauncher } from './SearchLauncher'
import { SourceStatus } from './SourceStatus'
import { useSearchHistory } from './useSearchHistory'
import { progressBySource, type SearchRun } from './types'

const HEADERS: [string, string][] = [
  ['Recherche', ''],
  ['Date', 'text-right'],
  ['Nouvelles', 'text-right'],
  ['Parcourues', 'text-right'],
  ['', ''],
]
const COLUMNS = 'sm:grid-cols-[minmax(0,1fr)_56px_80px_88px_136px] sm:items-start'

export function SearchesPage() {
  const { searches, loading, error, rerun, remove } = useSearchHistory()
  const finished = searches.filter(s => s.status === 'done' || s.status === 'error')
  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b border-rule px-4 py-6 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-title">Recherches</h1>
          <p className="mt-1 max-w-xl text-sm text-fg-2">
            Chaque recherche ne garde que les offres jamais vues. Relance-les pour suivre ce qui sort.
          </p>
        </div>
        <SearchLauncher />
      </div>
      <ActiveSearches />
      {error && <p className="px-6 py-4 text-danger">{error}</p>}
      {loading ? (
        <Skeleton className="m-6 h-40" />
      ) : finished.length === 0 ? (
        <EmptyState kicker="Historique" title="Aucune recherche pour l'instant">
          Lance une recherche pour ton profil ou une recherche libre avec le bouton Rechercher.
        </EmptyState>
      ) : (
        <HistoryTable runs={finished} onRerun={run => void rerun(run)} onRemove={run => void remove(run)} />
      )}
    </div>
  )
}

interface HistoryTableProps {
  runs: SearchRun[]
  onRerun: (run: SearchRun) => void
  onRemove: (run: SearchRun) => void
}

function HistoryTable({ runs, onRerun, onRemove }: HistoryTableProps) {
  return (
    <div role="table" aria-label="Historique des recherches">
      <div role="row" className={`hidden gap-4 border-b border-rule px-6 py-2 sm:grid ${COLUMNS}`}>
        {HEADERS.map(([title, align]) => (
          <span key={title || 'actions'} role="columnheader" className={`label ${align}`}>
            {title}
          </span>
        ))}
      </div>
      {runs.map(run => (
        <SearchRow key={run.id} run={run} onRerun={() => onRerun(run)} onRemove={() => onRemove(run)} />
      ))}
    </div>
  )
}

function SearchRow({ run, onRerun, onRemove }: { run: SearchRun; onRerun: () => void; onRemove: () => void }) {
  return (
    <div role="row" className={`grid gap-x-4 gap-y-2 border-b border-rule px-4 py-4 sm:grid ${COLUMNS} lg:px-6`}>
      <div role="cell" className="min-w-0 space-y-2">
        <p className="text-[15px] font-medium text-fg">
          « {run.query} » <span className="font-normal text-fg-2">{run.location}</span>
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {progressBySource(run).map(([source, progress]) => (
            <SourceStatus key={source} source={source} progress={progress} />
          ))}
        </div>
        {run.error && <p className="text-xs text-warning">{run.error}</p>}
      </div>
      <span role="cell" className="tabular font-mono text-xs sm:text-right text-fg-2">
        {compactAge(run.createdAt)}
      </span>
      <span role="cell" className="tabular font-mono text-xs sm:text-right text-fg">
        {run.newCount}
      </span>
      <span role="cell" className="tabular font-mono text-xs sm:text-right text-fg-2">
        {run.foundCount}
      </span>
      <span role="cell" className="flex justify-end gap-3 text-xs">
        <button onClick={onRerun} className="text-fg underline-offset-4 hover:underline">
          Relancer
        </button>
        <button onClick={onRemove} className="text-fg-3 underline-offset-4 hover:text-danger hover:underline">
          Supprimer
        </button>
      </span>
    </div>
  )
}

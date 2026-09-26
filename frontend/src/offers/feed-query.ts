import type { FeedView, Source } from './types'

export type SortOrder = 'score' | 'date'
export type RemoteFilter = 'hybrid' | 'full'

export interface FeedFilters {
  q: string
  sources: Source[]
  contracts: string[]
  remote: RemoteFilter | null
  minScore: number | null
  maxAgeDays: number | null
}

export interface FeedQuery {
  view: FeedView
  sort: SortOrder
  filters: FeedFilters
}

export const CONTRACT_OPTIONS = ['CDI', 'CDD', 'Intérim', 'Freelance', 'Stage', 'Alternance']
const VIEWS: FeedView[] = ['new', 'favorites', 'interested', 'seen', 'rejected']
const SOURCE_VALUES: Source[] = ['HELLOWORK', 'INDEED', 'LINKEDIN']

const list = (raw: string | null): string[] => (raw ? raw.split(',').filter(Boolean) : [])
const number = (raw: string | null): number | null => (raw && Number.isFinite(Number(raw)) ? Number(raw) : null)
const isSource = (value: string): value is Source => SOURCE_VALUES.some(s => s === value)
const isView = (value: string | null): value is FeedView => VIEWS.some(v => v === value)

// L'état du flux vit dans l'URL : il survit au rechargement et se partage
export function readQuery(params: URLSearchParams): FeedQuery {
  const remote = params.get('teletravail')
  const view = params.get('vue')
  return {
    view: isView(view) ? view : 'new',
    sort: params.get('tri') === 'date' ? 'date' : 'score',
    filters: {
      q: params.get('q') ?? '',
      sources: list(params.get('sources')).filter(isSource),
      contracts: list(params.get('contrats')).filter(c => CONTRACT_OPTIONS.includes(c)),
      remote: remote === 'hybrid' || remote === 'full' ? remote : null,
      minScore: number(params.get('score')),
      maxAgeDays: number(params.get('age')),
    },
  }
}

export function writeQuery({ view, sort, filters }: FeedQuery): URLSearchParams {
  const entries: [string, string | null][] = [
    ['vue', view === 'new' ? null : view],
    ['tri', sort === 'score' ? null : sort],
    ['q', filters.q || null],
    ['sources', filters.sources.join(',') || null],
    ['contrats', filters.contracts.join(',') || null],
    ['teletravail', filters.remote],
    ['score', filters.minScore?.toString() ?? null],
    ['age', filters.maxAgeDays?.toString() ?? null],
  ]
  return new URLSearchParams(entries.filter((e): e is [string, string] => e[1] !== null))
}

export const EMPTY_FILTERS: FeedFilters = {
  q: '',
  sources: [],
  contracts: [],
  remote: null,
  minScore: null,
  maxAgeDays: null,
}

export const activeFilterCount = (f: FeedFilters): number =>
  [f.q, f.sources.length, f.contracts.length, f.remote, f.minScore, f.maxAgeDays].filter(Boolean).length

// Format attendu par l'API : listes séparées par des virgules, valeurs vides omises
export function toApiParams(f: FeedFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (f.q) params.q = f.q
  if (f.sources.length) params.sources = f.sources.join(',')
  if (f.contracts.length) params.contracts = f.contracts.join(',')
  if (f.remote) params.remote = f.remote
  if (f.minScore) params.minScore = f.minScore
  if (f.maxAgeDays) params.maxAgeDays = f.maxAgeDays
  return params
}

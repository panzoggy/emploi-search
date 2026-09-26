import { SOURCES, type Source } from '../offers/types'

export type SourceState = 'waiting' | 'listing' | 'details' | 'done' | 'blocked' | 'error'

export interface SourceProgress {
  state: SourceState
  pages: number
  listed: number
  fresh: number
  note?: string
}

export interface SearchRun {
  id: string
  query: string
  location: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: Partial<Record<Source, SourceProgress>>
  foundCount: number
  newCount: number
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export const progressBySource = (run: SearchRun): [Source, SourceProgress][] =>
  SOURCES.flatMap(source => {
    const progress = run.progress[source]
    return progress ? [[source, progress]] : []
  })

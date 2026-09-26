import { useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from '../shared/lib/useInterval'
import { searchesApi } from './searches-api'
import type { SearchRun } from './types'

const POLL_MS = 2000

// Interroge l'API toutes les 2 s tant qu'une recherche tourne, puis s'arrête
export function useActiveSearches() {
  const [active, setActive] = useState<SearchRun[]>([])
  const [revision, setRevision] = useState(0)
  const [polling, setPolling] = useState(true)
  const lastSignature = useRef('')

  const poll = useCallback(async () => {
    try {
      const runs = await searchesApi.active()
      const signature = JSON.stringify(runs.map(r => [r.id, r.status, r.progress]))
      if (signature !== lastSignature.current) {
        lastSignature.current = signature
        setRevision(r => r + 1)
      }
      setActive(runs)
      setPolling(runs.length > 0)
    } catch {
      setPolling(false) // serveur momentanément injoignable : reprise au prochain lancement
    }
  }, [])

  useEffect(() => {
    void poll()
  }, [poll])

  useInterval(() => void poll(), POLL_MS, polling)

  const resume = useCallback(async () => {
    setPolling(true)
    await poll()
  }, [poll])

  return { active, revision, resume }
}

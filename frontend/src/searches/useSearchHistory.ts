import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../shared/api/client'
import { searchesApi } from './searches-api'
import { useSearchActivity } from './SearchActivity'
import type { SearchRun } from './types'

export function useSearchHistory() {
  const { revision, launch } = useSearchActivity()
  const [searches, setSearches] = useState<SearchRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setSearches((await searchesApi.history(1)).searches)
      setError(null)
    } catch (err) {
      setError(apiErrorMessage(err, "Impossible de charger l'historique"))
    } finally {
      setLoading(false)
    }
  }, [])

  // Se met à jour quand une recherche en cours progresse
  useEffect(() => {
    void load()
  }, [load, revision])

  const rerun = (run: SearchRun) => launch({ query: run.query, location: run.location })

  const remove = async (run: SearchRun) => {
    try {
      await searchesApi.remove(run.id)
      setSearches(current => current.filter(s => s.id !== run.id))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Suppression impossible'))
    }
  }

  return { searches, loading, error, rerun, remove }
}

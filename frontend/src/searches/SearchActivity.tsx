import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../shared/api/client'
import { searchesApi, type LaunchRequest } from './searches-api'
import { useActiveSearches } from './useActiveSearches'
import type { SearchRun } from './types'

interface SearchActivity {
  active: SearchRun[]
  // Change à chaque progression : les écrans qui affichent des offres s'en servent pour se rafraîchir
  revision: number
  launch: (request: LaunchRequest) => Promise<boolean>
}

const SearchActivityContext = createContext<SearchActivity | null>(null)

export function SearchActivityProvider({ children }: { children: ReactNode }) {
  const { active, revision, resume } = useActiveSearches()

  const launch = useCallback(
    async (request: LaunchRequest) => {
      try {
        const ids = await searchesApi.launch(request)
        toast.success(ids.length > 1 ? `${ids.length} recherches lancées` : 'Recherche lancée')
        await resume()
        return true
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Impossible de lancer la recherche'))
        return false
      }
    },
    [resume],
  )

  const value = useMemo(() => ({ active, revision, launch }), [active, revision, launch])
  return <SearchActivityContext.Provider value={value}>{children}</SearchActivityContext.Provider>
}

export function useSearchActivity(): SearchActivity {
  const context = useContext(SearchActivityContext)
  if (!context) throw new Error('useSearchActivity doit être utilisé sous SearchActivityProvider')
  return context
}

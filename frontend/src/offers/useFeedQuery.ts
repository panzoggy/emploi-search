import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EMPTY_FILTERS, readQuery, writeQuery, type FeedFilters, type FeedQuery } from './feed-query'

export function useFeedQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readQuery(params), [params])

  const update = useCallback(
    (patch: Partial<FeedQuery>) =>
      setParams(current => writeQuery({ ...readQuery(current), ...patch }), { replace: true }),
    [setParams],
  )
  const setFilter = useCallback(
    <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) =>
      setParams(
        current => {
          const q = readQuery(current)
          return writeQuery({ ...q, filters: { ...q.filters, [key]: value } })
        },
        { replace: true },
      ),
    [setParams],
  )
  const resetFilters = useCallback(() => update({ filters: EMPTY_FILTERS }), [update])

  return { ...query, update, setFilter, resetFilters }
}

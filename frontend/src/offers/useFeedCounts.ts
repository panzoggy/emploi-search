import { useCallback, useEffect, useState } from 'react'
import { offersApi } from './offers-api'
import type { FeedCounts } from './types'

const EMPTY: FeedCounts = { new: 0, favorites: 0, interested: 0, seen: 0, rejected: 0 }

export function useFeedCounts(): { counts: FeedCounts; refresh: () => void } {
  const [counts, setCounts] = useState<FeedCounts>(EMPTY)
  const refresh = useCallback(() => {
    offersApi.counts().then(setCounts, () => undefined) // compteurs non critiques : on garde les derniers connus
  }, [])
  useEffect(refresh, [refresh])
  return { counts, refresh }
}

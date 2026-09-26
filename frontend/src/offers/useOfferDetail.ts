import { useEffect, useState } from 'react'
import { apiErrorMessage } from '../shared/api/client'
import { offersApi } from './offers-api'
import type { OfferDetail } from './types'

// Le détail contient le score et le statut de l'utilisateur : le cache est vidé à chaque changement de compte
const cache = new Map<string, OfferDetail>()

export function resetOfferCache(): void {
  cache.clear()
}

export function useOfferDetail(id: string | null): { detail: OfferDetail | null; error: string | null } {
  const [detail, setDetail] = useState<OfferDetail | null>(id ? (cache.get(id) ?? null) : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    if (!id) return setDetail(null)
    setDetail(cache.get(id) ?? null)
    let cancelled = false
    offersApi.detail(id).then(
      loaded => {
        cache.set(id, loaded)
        if (!cancelled) setDetail(loaded)
      },
      err => !cancelled && setError(apiErrorMessage(err, "Impossible d'afficher cette offre")),
    )
    return () => {
      cancelled = true
    }
  }, [id])

  return { detail, error }
}

import { useEffect } from 'react'
import { offersApi } from './offers-api'
import type { OfferSummary } from './types'

// Une offre compte comme "vue" quand elle reste affichée un instant, pas quand on la survole en passant
const DWELL_MS = 1500

export function useSeenOnDwell(offer: OfferSummary | null, onSeen: (id: string) => void): void {
  const id = offer?.status === null ? offer.id : null
  useEffect(() => {
    if (!id) return
    const timer = setTimeout(() => {
      offersApi.setStatus(id, 'SEEN').then(
        () => onSeen(id),
        () => undefined, // sans conséquence : l'offre sera marquée vue à la prochaine ouverture
      )
    }, DWELL_MS)
    return () => clearTimeout(timer)
  }, [id, onSeen])
}

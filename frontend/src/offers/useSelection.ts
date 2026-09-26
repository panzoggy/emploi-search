import { useCallback, useEffect, useState } from 'react'
import type { OfferSummary } from './types'

// Offre affichée dans le détail. Sur grand écran il y en a toujours une ; sur mobile, seulement au toucher.
export function useSelection(offers: OfferSummary[], isDesktop: boolean) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = offers.find(o => o.id === selectedId) ?? null

  useEffect(() => {
    if (isDesktop && !selected && offers.length > 0) setSelectedId(offers[0].id)
  }, [isDesktop, selected, offers])

  // Quand l'offre affichée quitte la liste, on passe à la suivante
  const leave = useCallback(
    (id: string) => {
      const index = offers.findIndex(o => o.id === id)
      const neighbour = offers[index + 1] ?? offers[index - 1]
      setSelectedId(isDesktop && neighbour ? neighbour.id : null)
    },
    [offers, isDesktop],
  )

  const step = (delta: number) => {
    const index = offers.findIndex(o => o.id === selectedId)
    const target = offers[Math.min(offers.length - 1, Math.max(0, index + delta))]
    if (target) setSelectedId(target.id)
  }

  return { selected, setSelectedId, leave, step }
}

import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../shared/api/client'
import { offersApi } from './offers-api'
import type { FeedState } from './useFeed'
import type { FeedView, OfferStatus, OfferSummary } from './types'

const VIEW_STATUS: Record<Exclude<FeedView, 'new'>, OfferStatus> = {
  favorites: 'FAVORITE',
  interested: 'INTERESTED',
  seen: 'SEEN',
  rejected: 'REJECTED',
}

const CONFIRMATIONS: Record<OfferStatus | 'NONE', string> = {
  FAVORITE: 'Ajoutée aux favoris',
  INTERESTED: 'Marquée « intéressé »',
  REJECTED: 'Offre écartée',
  SEEN: 'Déplacée dans les vues',
  NONE: 'Remise dans les nouvelles',
}

const staysInView = (view: FeedView, status: OfferStatus | null): boolean =>
  view === 'new' ? status === null || status === 'SEEN' : VIEW_STATUS[view] === status

const apply = (id: string, status: OfferStatus | null) =>
  status === null ? offersApi.clearStatus(id) : offersApi.setStatus(id, status)

function confirmWithUndo(message: string, undo: () => Promise<void>): void {
  toast(
    t => (
      <span className="flex items-center gap-4">
        {message}
        <button
          className="font-medium text-accent hover:underline"
          onClick={() => {
            toast.dismiss(t.id)
            void undo()
          }}
        >
          Annuler
        </button>
      </span>
    ),
    { duration: 4000 },
  )
}

interface TriageOptions {
  view: FeedView
  feed: FeedState
  refreshCounts: () => void
  onLeave: (id: string) => void
}

// Classe une offre tout de suite à l'écran, puis confirme côté serveur avec possibilité d'annuler
export function useTriage({ view, feed, refreshCounts, onLeave }: TriageOptions) {
  return useCallback(
    async (offer: OfferSummary, status: OfferStatus | null) => {
      if (offer.status === status) return
      const previous = offer.status
      if (staysInView(view, status)) feed.patchLocal(offer.id, { status })
      else {
        onLeave(offer.id)
        feed.removeLocal(offer.id)
      }
      try {
        await apply(offer.id, status)
        refreshCounts()
        confirmWithUndo(CONFIRMATIONS[status ?? 'NONE'], async () => {
          await apply(offer.id, previous).catch(() => undefined)
          await feed.reload()
          refreshCounts()
        })
      } catch (error) {
        toast.error(apiErrorMessage(error, "Le classement n'a pas été enregistré"))
        await feed.reload()
      }
    },
    [view, feed, refreshCounts, onLeave],
  )
}

import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '../shared/ui/Skeleton'
import { OfferListItem } from './OfferListItem'
import type { FeedState } from './useFeed'

interface OfferListProps {
  feed: FeedState
  selectedId: string | null
  onSelect: (id: string) => void
}

export function OfferList({ feed, selectedId, onSelect }: OfferListProps) {
  const sentinel = useLoadMoreSentinel(feed.hasMore, feed.loadMore)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  if (feed.loading) return <ListSkeleton />
  return (
    <>
      <ul>
        <AnimatePresence initial={false}>
          {feed.offers.map(offer => (
            <OfferListItem
              key={offer.id}
              ref={offer.id === selectedId ? selectedRef : undefined}
              offer={offer}
              selected={offer.id === selectedId}
              onSelect={() => onSelect(offer.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
      <div ref={sentinel} className="flex justify-center py-4">
        {feed.loadingMore && <Loader2 className="h-4 w-4 animate-spin text-fg-3" aria-label="Chargement" />}
      </div>
    </>
  )
}

// Charge la suite quand on approche du bas de la liste
function useLoadMoreSentinel(hasMore: boolean, loadMore: () => Promise<void>) {
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && void loadMore(), {
      rootMargin: '400px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])
  return sentinel
}

const ListSkeleton = () => (
  <div aria-busy>
    {Array.from({ length: 7 }, (_, i) => (
      <div key={i} className="grid grid-cols-[40px_1fr] gap-4 border-b border-rule px-4 py-4 lg:px-6">
        <Skeleton className="h-4 w-7" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

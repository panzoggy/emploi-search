import { Link } from 'react-router-dom'
import { useProfileReady } from '../profile'
import { plural } from '../shared/lib/format'
import { EmptyState } from '../shared/ui/EmptyState'
import { activeFilterCount } from './feed-query'
import { OfferList } from './OfferList'
import type { FeedController } from './useFeedController'
import type { FeedView } from './types'

// Colonne de gauche : ligne de total, bandeau des arrivées, liste
export function FeedColumn({ controller: c }: { controller: FeedController }) {
  const { feed } = c
  const filtered = activeFilterCount(c.query.filters) > 0
  return (
    <section aria-label="Liste des offres" className="flex min-h-0 min-w-0 flex-col border-rule lg:border-r">
      <div className="flex items-center justify-between border-b border-rule px-4 py-2 lg:px-6">
        <span className="label">
          {plural(feed.total, 'offre', 'offres')}
          {filtered && ' filtrées'}
        </span>
        {c.pendingNew > 0 && (
          <button onClick={() => void feed.reload()} className="text-xs text-accent underline-offset-4 hover:underline">
            {plural(c.pendingNew, 'nouvelle arrivée', 'nouvelles arrivées')}, afficher
          </button>
        )}
      </div>
      <div className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto">
        {feed.error && <p className="px-6 py-4 text-danger">{feed.error}</p>}
        {!feed.loading && feed.offers.length === 0 ? (
          <FeedEmpty view={c.query.view} filtered={filtered} onReset={c.query.resetFilters} />
        ) : (
          <OfferList feed={feed} selectedId={c.selected?.id ?? null} onSelect={c.setSelectedId} />
        )}
      </div>
    </section>
  )
}

const EMPTY_MESSAGES: Record<FeedView, string> = {
  new: 'Tu as tout vu. Lance une recherche pour aller chercher des offres que tu ne connais pas encore.',
  favorites: 'Les offres à garder sous la main arrivent ici. Touche F sur une offre.',
  interested: 'Les offres auxquelles tu veux postuler arrivent ici. Touche I sur une offre.',
  seen: 'Les offres ouvertes mais pas encore classées arrivent ici.',
  rejected: 'Les offres écartées (touche X) arrivent ici. Elles apprennent au classement ce que tu ne veux pas.',
}

function FeedEmpty({ view, filtered, onReset }: { view: FeedView; filtered: boolean; onReset: () => void }) {
  const profileReady = useProfileReady()
  if (filtered) {
    const action = (
      <button onClick={onReset} className="text-sm text-fg underline underline-offset-4">
        Effacer les filtres
      </button>
    )
    return <EmptyState kicker="Filtres" title="Aucune offre ne passe ces filtres" action={action} />
  }
  if (view === 'new' && profileReady === false) {
    const action = (
      <Link to="/profil" className="inline-flex h-9 items-center bg-accent px-4 text-sm font-medium text-accent-fg">
        Remplir mon profil
      </Link>
    )
    return (
      <EmptyState kicker="Pour commencer" title="Décris ce que tu cherches" action={action}>
        Indique les métiers que tu vises, ou dépose ton CV : les offres seront classées pour toi.
      </EmptyState>
    )
  }
  return (
    <EmptyState kicker="Liste vide" title="Rien ici pour l'instant">
      {EMPTY_MESSAGES[view]}
    </EmptyState>
  )
}

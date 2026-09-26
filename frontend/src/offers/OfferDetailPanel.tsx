import { AnimatePresence, motion } from 'framer-motion'
import { relativeDate, salaryRange } from '../shared/lib/format'
import { ScoreMeter } from '../shared/ui/ScoreMeter'
import { Skeleton } from '../shared/ui/Skeleton'
import { MatchReasons } from './MatchReasons'
import { REMOTE_LABELS } from './OfferMeta'
import { TriageActions } from './TriageActions'
import { useOfferDetail } from './useOfferDetail'
import { SOURCE_LABELS, type OfferStatus, type OfferSummary } from './types'

interface OfferDetailPanelProps {
  offer: OfferSummary
  onTriage: (status: OfferStatus | null) => void
}

export function OfferDetailPanel({ offer, onTriage }: OfferDetailPanelProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={offer.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-[820px] px-6 py-8 lg:px-10"
      >
        <OfferHeader offer={offer} onTriage={onTriage} />
        <MatchSection offer={offer} />
        <DescriptionSection offerId={offer.id} />
      </motion.article>
    </AnimatePresence>
  )
}

const LEVELS: Record<string, string> = {
  intern: 'Stage',
  apprentice: 'Alternance',
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead',
}

function OfferHeader({ offer, onTriage }: OfferDetailPanelProps) {
  const facts: [string, string | null][] = [
    ['Lieu', offer.location || null],
    ['Contrat', offer.contractType],
    ['Salaire', salaryRange(offer.salaryMin, offer.salaryMax)],
    ['Télétravail', offer.remoteType ? REMOTE_LABELS[offer.remoteType].replace('Télétravail ', '') : null],
    ['Niveau', offer.seniority ? (LEVELS[offer.seniority] ?? null) : null],
  ]
  return (
    <header>
      <p className="label">
        {SOURCE_LABELS[offer.source]} · publiée {relativeDate(offer.postedAt ?? offer.scrapedAt)}
      </p>
      <h2 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-title text-fg">{offer.title}</h2>
      <p className="mt-2 text-base text-fg-2">{offer.company}</p>
      <dl className="mt-6 grid grid-cols-2 border-y border-rule sm:grid-cols-5">
        {facts.map(([label, value]) => (
          <div key={label} className="border-rule py-3 pr-4 sm:border-r sm:pl-4 sm:first:pl-0 sm:last:border-r-0">
            <dt className="label">{label}</dt>
            <dd className={value ? 'mt-1 text-sm text-fg' : 'mt-1 text-sm text-fg-3'}>{value ?? 'non précisé'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <TriageActions offer={offer} onTriage={onTriage} />
      </div>
    </header>
  )
}

const verdictSentence = (score: number): string =>
  score >= 75 ? 'Très bonne correspondance' : score >= 50 ? 'Correspondance moyenne' : 'Faible correspondance'

function MatchSection({ offer }: { offer: OfferSummary }) {
  return (
    <section
      aria-labelledby="match-title"
      className="mt-10 grid gap-6 border-t border-rule pt-6 sm:grid-cols-[176px_1fr]"
    >
      <div>
        <h3 id="match-title" className="label mb-4">
          Correspondance
        </h3>
        <ScoreMeter score={offer.score} size="lg" />
        <p className="mt-3 text-xs leading-relaxed text-fg-2">
          {offer.excluded ? 'Exclue par ton profil' : verdictSentence(offer.score)}. Calculée d'après ton profil et tes
          choix précédents.
        </p>
      </div>
      <MatchReasons reasons={offer.reasons} />
    </section>
  )
}

function DescriptionSection({ offerId }: { offerId: string }) {
  const { detail, error } = useOfferDetail(offerId)
  return (
    <section aria-labelledby="description-title" className="mt-10 border-t border-rule pt-6">
      <h3 id="description-title" className="label mb-4">
        Description
      </h3>
      {error && <p className="text-danger">{error}</p>}
      {!detail && !error && <DescriptionSkeleton />}
      {detail && (
        <p className="max-w-[68ch] whitespace-pre-line text-[15px] leading-7 text-fg-2">
          {detail.description || "Le site n'a pas fourni de description. Ouvre l'offre pour la lire en entier."}
        </p>
      )}
      {detail?.search && (
        <p className="mt-10 font-mono text-[11px] text-fg-3">
          Trouvée par la recherche « {detail.search.query} », {detail.search.location}
        </p>
      )}
    </section>
  )
}

const DescriptionSkeleton = () => (
  <div className="max-w-[68ch] space-y-3">
    {[100, 94, 97, 72, 90, 60].map(width => (
      <Skeleton key={width} className="h-3.5" style={{ width: `${width}%` }} />
    ))}
  </div>
)

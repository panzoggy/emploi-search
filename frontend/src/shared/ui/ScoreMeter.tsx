import { cn } from '../lib/cn'

// Le score se lit comme une donnée : un nombre (et une jauge dans le détail), sans couleur décorative.
// Plus la correspondance est bonne, plus l'encre est dense.
export const scoreTone = (score: number): string => (score >= 75 ? 'text-fg' : score >= 50 ? 'text-fg-2' : 'text-fg-3')

export function ScoreMeter({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  const large = size === 'lg'
  return (
    <div className={cn('shrink-0', scoreTone(score))} aria-label={`Correspondance ${score} sur 100`}>
      <span className={cn('tabular block font-mono leading-none', large ? 'text-5xl font-medium' : 'text-base')}>
        {score}
      </span>
      {large && (
        <span className="mt-3 block h-1 w-32 bg-rule" aria-hidden>
          <span className="block h-full bg-current" style={{ width: `${score}%` }} />
        </span>
      )}
    </div>
  )
}

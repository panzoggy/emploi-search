import { AnimatePresence, motion } from 'framer-motion'
import { useSearchActivity } from './SearchActivity'
import { SourceStatus } from './SourceStatus'
import { progressBySource } from './types'

const STATUS_LABELS: Record<string, string> = { queued: 'En attente', running: 'En cours' }

// Recherches en cours, une ligne chacune, sous les onglets du flux
export function ActiveSearches() {
  const { active } = useSearchActivity()
  return (
    <AnimatePresence initial={false}>
      {active.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden border-b border-rule bg-surface"
        >
          {active.map(run => (
            <li key={run.id} className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:gap-6 lg:px-6">
              <span className="shrink-0 text-xs text-fg">
                <span className="label mr-3">{STATUS_LABELS[run.status]}</span>« {run.query} », {run.location}
              </span>
              {run.status === 'running' && (
                <span className="flex flex-wrap gap-x-5 gap-y-1">
                  {progressBySource(run).map(([source, progress]) => (
                    <SourceStatus key={source} source={source} progress={progress} />
                  ))}
                </span>
              )}
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  )
}

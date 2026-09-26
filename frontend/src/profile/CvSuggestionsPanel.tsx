import { motion } from 'framer-motion'
import { Button } from '../shared/ui/Button'
import { Tag } from '../shared/ui/Tag'
import { SENIORITY_LABELS, type CvSuggestions, type ProfilePreferences, type Seniority } from './types'

type ListKey = 'targetTitles' | 'skills' | 'locations'

const GROUPS: { key: ListKey; label: string }[] = [
  { key: 'targetTitles', label: 'Métiers' },
  { key: 'skills', label: 'Compétences' },
  { key: 'locations', label: 'Lieux' },
]

interface CvSuggestionsPanelProps {
  suggestions: CvSuggestions
  draft: ProfilePreferences
  onAdd: (key: ListKey, values: string[]) => void
  onSeniority: (value: Seniority) => void
}

// Ce que le CV suggère et qui n'est pas encore dans la fiche
export function CvSuggestionsPanel({ suggestions, draft, onAdd, onSeniority }: CvSuggestionsPanelProps) {
  const missing = (key: ListKey) =>
    suggestions[key].filter(v => !draft[key].some(x => x.toLowerCase() === v.toLowerCase()))
  const groups = GROUPS.map(g => ({ ...g, values: missing(g.key) })).filter(g => g.values.length > 0)
  const seniority = suggestions.seniority !== draft.seniority ? suggestions.seniority : null
  if (groups.length === 0 && !seniority) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
      className="mt-4 space-y-4 border border-rule bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="label">Trouvé dans ton CV</p>
        <Button size="sm" variant="ghost" onClick={() => groups.forEach(g => onAdd(g.key, g.values))}>
          Tout ajouter
        </Button>
      </div>
      {groups.map(group => (
        <SuggestionGroup key={group.key} label={group.label} values={group.values} onAdd={v => onAdd(group.key, [v])} />
      ))}
      {seniority && (
        <p className="flex flex-wrap items-center gap-3 text-xs text-fg-2">
          Environ {suggestions.yearsOfExperience} ans d'expérience : niveau {SENIORITY_LABELS[seniority]}
          <Button size="sm" variant="secondary" onClick={() => onSeniority(seniority)}>
            Appliquer
          </Button>
        </p>
      )}
    </motion.div>
  )
}

function SuggestionGroup({ label, values, onAdd }: { label: string; values: string[]; onAdd: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-fg-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map(value => (
          <Tag key={value} onClick={() => onAdd(value)}>
            <span className="font-mono text-fg-3">+</span>
            {value}
          </Tag>
        ))}
      </div>
    </div>
  )
}

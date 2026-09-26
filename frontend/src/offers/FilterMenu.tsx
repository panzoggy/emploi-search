import { useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../shared/lib/cn'
import { Popover } from '../shared/ui/Popover'

interface FilterMenuProps {
  label: string
  summary: string | null
  children: (close: () => void) => ReactNode
}

// En-tête de colonne cliquable : "Contrat" au repos, "Contrat CDI, CDD" une fois filtré
export function FilterMenu({ label, summary, children }: FilterMenuProps) {
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-xs',
          'transition-colors duration-150 ease-swiss',
          summary ? 'border-fg text-fg' : 'border-transparent text-fg-2 hover:border-rule-strong hover:text-fg',
          open && 'border-fg text-fg',
        )}
      >
        <span>{label}</span>
        {summary && <span className="max-w-40 truncate font-medium">{summary}</span>}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <Popover open={open} onClose={close} anchor={anchor}>
        {children(close)}
      </Popover>
    </>
  )
}

interface Choice<T> {
  value: T
  label: string
}

// Case carrée : cochée = encre pleine
const Box = ({ checked, round }: { checked: boolean; round?: boolean }) => (
  <span
    className={cn(
      'grid h-3.5 w-3.5 shrink-0 place-items-center border',
      checked ? 'border-fg' : 'border-rule-strong',
      round && 'rounded-full',
    )}
    aria-hidden
  >
    {checked && <span className={cn('h-1.5 w-1.5 bg-fg', round && 'rounded-full')} />}
  </span>
)

const optionClass = 'flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-fg hover:bg-elevated'

export function MultiChoice<T extends string>({
  choices,
  values,
  onChange,
}: {
  choices: Choice<T>[]
  values: T[]
  onChange: (v: T[]) => void
}) {
  const toggle = (value: T) => onChange(values.includes(value) ? values.filter(v => v !== value) : [...values, value])
  return (
    <div className="py-2" role="group">
      {choices.map(choice => (
        <button
          key={choice.value}
          type="button"
          role="checkbox"
          aria-checked={values.includes(choice.value)}
          onClick={() => toggle(choice.value)}
          className={optionClass}
        >
          <Box checked={values.includes(choice.value)} />
          {choice.label}
        </button>
      ))}
      {values.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-1 w-full border-t border-rule px-4 pt-2 text-left text-xs text-fg-2 hover:text-fg"
        >
          Tout afficher
        </button>
      )}
    </div>
  )
}

export function SingleChoice<T>({
  choices,
  value,
  onChange,
}: {
  choices: Choice<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="py-2" role="radiogroup">
      {choices.map(choice => (
        <button
          key={choice.label}
          type="button"
          role="radio"
          aria-checked={choice.value === value}
          onClick={() => onChange(choice.value)}
          className={optionClass}
        >
          <Box checked={choice.value === value} round />
          {choice.label}
        </button>
      ))}
    </div>
  )
}

interface MultiFilterProps<T extends string> {
  label: string
  choices: Choice<T>[]
  values: T[]
  onChange: (values: T[]) => void
}

export function MultiFilter<T extends string>({ label, choices, values, onChange }: MultiFilterProps<T>) {
  const summary =
    choices
      .filter(c => values.includes(c.value))
      .map(c => c.label)
      .join(', ') || null
  return (
    <FilterMenu label={label} summary={summary}>
      {() => <MultiChoice choices={choices} values={values} onChange={onChange} />}
    </FilterMenu>
  )
}

interface SingleFilterProps<T> {
  label: string
  choices: Choice<T | null>[]
  value: T | null
  onChange: (value: T | null) => void
  summary?: string | null
}

// Choix unique : le menu se ferme dès qu'on a choisi. Aucun résumé tant que la valeur est "tout".
export function SingleFilter<T>({ label, choices, value, onChange, summary }: SingleFilterProps<T>) {
  const shown = value === null ? null : (summary ?? choices.find(c => c.value === value)?.label ?? null)
  return (
    <FilterMenu label={label} summary={shown}>
      {close => (
        <SingleChoice
          choices={choices}
          value={value}
          onChange={v => {
            onChange(v)
            close()
          }}
        />
      )}
    </FilterMenu>
  )
}

import { cn } from '../lib/cn'

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex divide-x divide-rule-strong border border-rule-strong"
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-8 px-3 text-xs transition-colors duration-150 ease-swiss',
            option.value === value ? 'bg-fg text-canvas' : 'text-fg-2 hover:bg-elevated hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

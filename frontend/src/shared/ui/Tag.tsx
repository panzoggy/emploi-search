import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'

interface TagProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

// Étiquette carrée. Sélectionnée, elle s'inverse (fond encre) plutôt que de se colorer.
export function Tag({ children, selected, onClick, onRemove }: TagProps) {
  const className = cn(
    'inline-flex h-7 items-center gap-1.5 border px-2.5 text-xs transition-colors duration-150 ease-swiss',
    selected ? 'border-fg bg-fg text-canvas' : 'border-rule-strong text-fg',
    onClick && !selected && 'hover:bg-elevated',
  )
  const remove = onRemove && (
    <button type="button" aria-label="Retirer" onClick={onRemove} className="-mr-1 p-0.5 text-fg-3 hover:text-fg">
      <X className="h-3 w-3" aria-hidden />
    </button>
  )
  if (!onClick) {
    return (
      <span className={className}>
        {children}
        {remove}
      </span>
    )
  }
  return (
    <button type="button" aria-pressed={selected} className={className} onClick={onClick}>
      {children}
    </button>
  )
}

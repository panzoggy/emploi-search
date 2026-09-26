import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// Inutile au toucher : masqué sur petit écran
export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd
    className={cn(
      'hidden h-4 min-w-4 items-center justify-center border border-rule-strong px-1',
      'font-mono text-[10px] leading-none text-fg-3 sm:inline-flex',
    )}
  >
    {children}
  </kbd>
)

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full border border-rule-strong bg-transparent px-3 text-sm text-fg placeholder:text-fg-3',
        'transition-colors duration-150 ease-swiss hover:border-fg-3 focus:border-fg focus:outline-none',
        className,
      )}
      {...props}
    />
  )
})

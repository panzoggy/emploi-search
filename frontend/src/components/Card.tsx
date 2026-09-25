import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-xl border bg-white text-gray-950 shadow-sm', className)}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
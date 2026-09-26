import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'

export const Skeleton = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <div className={cn('animate-pulse bg-surface', className)} style={style} aria-hidden />
)

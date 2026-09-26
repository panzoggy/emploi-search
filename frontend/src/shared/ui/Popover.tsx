import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  open: boolean
  onClose: () => void
  anchor: RefObject<HTMLElement>
  children: ReactNode
  align?: 'start' | 'end'
  width?: number
}

// Rendu dans <body> en position fixe : jamais rogné par une barre qui défile (overflow)
export function Popover({ open, onClose, anchor, children, align = 'start', width = 260 }: PopoverProps) {
  const panel = useRef<HTMLDivElement>(null)
  const position = useAnchorPosition(open, anchor, align, width)
  useDismiss(open, onClose, anchor, panel)
  if (!open || !position) return null
  return createPortal(
    <div
      ref={panel}
      role="dialog"
      style={{ position: 'fixed', ...position, width }}
      className="z-50 border border-rule-strong bg-surface shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]"
    >
      {children}
    </div>,
    document.body,
  )
}

function useAnchorPosition(open: boolean, anchor: RefObject<HTMLElement>, align: 'start' | 'end', width: number) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!open) return setPosition(null)
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect()
      if (!rect) return
      const left = align === 'end' ? rect.right - width : rect.left
      setPosition({ top: rect.bottom + 4, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchor, align, width])
  return position
}

// Fermeture au clic extérieur ou sur Échap. Le bouton d'ancrage est exclu, sinon il rouvrirait aussitôt.
function useDismiss(open: boolean, onClose: () => void, anchor: RefObject<HTMLElement>, panel: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node) || panel.current?.contains(target) || anchor.current?.contains(target)) return
      onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onClose()
      anchor.current?.focus()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchor, panel])
}

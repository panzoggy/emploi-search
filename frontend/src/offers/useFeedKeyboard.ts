import { useEffect, useRef } from 'react'

export interface FeedShortcuts {
  next: () => void
  previous: () => void
  favorite: () => void
  interested: () => void
  reject: () => void
  open: () => void
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const KEYS: Record<string, keyof FeedShortcuts> = {
  j: 'next',
  ArrowDown: 'next',
  k: 'previous',
  ArrowUp: 'previous',
  f: 'favorite',
  i: 'interested',
  x: 'reject',
  o: 'open',
  Enter: 'open',
}

export function useFeedKeyboard(shortcuts: FeedShortcuts, enabled: boolean): void {
  const latest = useRef(shortcuts)
  latest.current = shortcuts

  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const action = KEYS[event.key]
      if (!action) return
      event.preventDefault()
      latest.current[action]()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

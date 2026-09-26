import { useEffect, useRef } from 'react'

export function useInterval(callback: () => void, delayMs: number, enabled: boolean): void {
  const latest = useRef(callback)
  latest.current = callback
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => latest.current(), delayMs)
    return () => clearInterval(timer)
  }, [delayMs, enabled])
}

import { useMemo } from 'react'

// Garde la même référence tant que le contenu ne change pas (objets reconstruits à chaque rendu)
export function useStableValue<T>(value: T): T {
  const key = JSON.stringify(value)
  return useMemo(() => value, [key])
}

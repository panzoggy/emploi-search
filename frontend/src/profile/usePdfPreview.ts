import { useEffect, useRef, useState } from 'react'
import { api, apiErrorMessage } from '../shared/api/client'
import { renderPdf } from './pdf-render'

// Télécharge le CV (avec la session de l'utilisateur) et le dessine dans le conteneur
export function usePdfPreview(url: string, open: boolean) {
  const container = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const node = container.current
    if (!open || !node) return
    let cancelled = false
    setState('loading')
    api
      .get<ArrayBuffer>(url, { responseType: 'arraybuffer' })
      .then(({ data }) => (cancelled ? undefined : renderPdf(data, node, node.clientWidth)))
      .then(() => !cancelled && setState('ready'))
      .catch((err: unknown) => {
        if (cancelled) return
        setError(apiErrorMessage(err, "Impossible d'afficher ce PDF"))
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [url, open])

  return { container, state, error }
}

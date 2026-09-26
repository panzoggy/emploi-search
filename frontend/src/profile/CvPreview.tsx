import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../shared/lib/cn'
import { usePdfPreview } from './usePdfPreview'
import type { Profile } from './types'

// Aperçu du CV enregistré. Le paramètre v force le rechargement après un nouvel import.
export function CvPreview({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  if (!profile.hasCv) return null
  const url = `/profile/cv?v=${encodeURIComponent(profile.cvUpdatedAt ?? '')}`
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-5 text-xs">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="text-fg underline underline-offset-4"
        >
          {open ? "Masquer l'aperçu" : 'Voir le CV'}
        </button>
        {profile.hasCvFile && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-fg-2 hover:text-fg"
          >
            Ouvrir dans un onglet <ArrowUpRight className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>
      {open && (profile.hasCvFile ? <PdfPages url={url} /> : <ExtractedText text={profile.cvText ?? ''} />)}
    </div>
  )
}

function PdfPages({ url }: { url: string }) {
  const { container, state, error } = usePdfPreview(url, true)
  return (
    <div className="mt-3 max-w-[720px]">
      {state === 'loading' && <p className="label py-4">Chargement du CV…</p>}
      {error && <p className="py-4 text-sm text-danger">{error}</p>}
      {/* Pages dessinées par pdf.js, séparées par un filet */}
      <div ref={container} className="space-y-3 [&>canvas]:border [&>canvas]:border-rule-strong" />
    </div>
  )
}

// CV importé avant l'aperçu : seul le texte extrait a été conservé
const ExtractedText = ({ text }: { text: string }) => (
  <div className="mt-3 border border-rule-strong">
    <p className="border-b border-rule px-4 py-2 text-xs text-fg-2">
      Texte extrait du CV. Réimporte le PDF pour voir sa mise en page d'origine.
    </p>
    <pre
      className={cn(
        'scrollbar-quiet max-h-[60vh] overflow-auto whitespace-pre-wrap p-4',
        'font-mono text-xs leading-relaxed text-fg-2',
      )}
    >
      {text}
    </pre>
  </div>
)

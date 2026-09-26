import { useRef, useState, type DragEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../shared/lib/cn'
import { relativeDate } from '../shared/lib/format'
import { Button } from '../shared/ui/Button'
import type { Profile } from './types'

interface CvDropzoneProps {
  profile: Profile
  uploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}

export function CvDropzone({ profile, uploading, onFile, onRemove }: CvDropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const { dragging, handlers } = useFileDrop(onFile)
  return (
    <div
      {...handlers}
      className={cn(
        'flex flex-col gap-4 border border-dashed p-5 transition-colors sm:flex-row sm:items-center',
        dragging ? 'border-fg bg-surface' : 'border-rule-strong',
      )}
    >
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {uploading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-2" aria-hidden />}
      <CvStatus profile={profile} uploading={uploading} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => input.current?.click()} disabled={uploading}>
          {profile.hasCv ? 'Remplacer' : 'Choisir un fichier'}
        </Button>
        {profile.hasCv && (
          <Button size="sm" variant="danger" onClick={onRemove}>
            Retirer
          </Button>
        )}
      </div>
    </div>
  )
}

function CvStatus({ profile, uploading }: { profile: Profile; uploading: boolean }) {
  const [title, hint] = profile.hasCv
    ? [profile.cvFileName, `Importé ${relativeDate(profile.cvUpdatedAt)} · il enrichit le calcul des scores`]
    : [
        uploading ? 'Lecture du CV…' : 'Dépose ton CV au format PDF',
        "On en tire tes métiers, compétences et années d'expérience. Tu valides ensuite.",
      ]
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-mono text-[13px] text-fg">{title}</p>
      <p className="text-xs text-fg-2">{hint}</p>
    </div>
  )
}

function useFileDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false)
  const handlers = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) onFile(file)
    },
  }
  return { dragging, handlers }
}

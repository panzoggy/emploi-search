import { useRef, useState, type FormEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '../shared/ui/Button'
import { Popover } from '../shared/ui/Popover'
import { TextField } from '../shared/ui/TextField'
import { useSearchActivity } from './SearchActivity'
import type { LaunchRequest } from './searches-api'

export function SearchLauncher() {
  const { launch } = useSearchActivity()
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const run = async (request: LaunchRequest) => {
    setSending(true)
    const ok = await launch(request)
    setSending(false)
    if (ok) setOpen(false)
  }

  return (
    <>
      <Button ref={anchor} variant="primary" size="sm" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        Rechercher
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} align="end" width={340}>
        <ProfileSearch sending={sending} onLaunch={() => void run({ fromProfile: true })} />
        <FreeSearchForm sending={sending} onSubmit={request => void run(request)} />
      </Popover>
    </>
  )
}

function FreeSearchForm({ sending, onSubmit }: { sending: boolean; onSubmit: (r: LaunchRequest) => void }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const valid = query.trim().length >= 2 && location.trim().length >= 2
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) onSubmit({ query: query.trim(), location: location.trim() })
  }
  return (
    <form onSubmit={submit} className="space-y-2 border-t border-rule p-4">
      <h3 className="label mb-3">Recherche libre</h3>
      <TextField placeholder="Poste, métier, mot-clé" value={query} onChange={e => setQuery(e.target.value)} />
      <TextField placeholder="Ville ou région" value={location} onChange={e => setLocation(e.target.value)} />
      <Button type="submit" size="sm" className="w-full" loading={sending} disabled={!valid}>
        Lancer
      </Button>
    </form>
  )
}

const ProfileSearch = ({ sending, onLaunch }: { sending: boolean; onLaunch: () => void }) => (
  <section className="space-y-3 p-4">
    <h3 className="label">Pour ton profil</h3>
    <p className="text-xs leading-relaxed text-fg-2">
      Une recherche par métier visé et par lieu de ton profil. Seules les offres inédites sont gardées.
    </p>
    <Button variant="primary" size="sm" className="w-full" loading={sending} onClick={onLaunch}>
      Lancer pour mon profil
    </Button>
  </section>
)

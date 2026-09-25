import { useState } from 'react'
import { Search, Loader2, CheckCircle } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { Select } from './Select'
import { searchApi } from '../services/api'
import type { SearchFilters } from '../types'
import toast from 'react-hot-toast'

const CONTRACT_OPTIONS = [
  { value: '', label: 'Tous types' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' },
]

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Tous niveaux' },
  { value: 'junior', label: 'Junior (0-2 ans)' },
  { value: 'mid', label: 'Confirmé (2-5 ans)' },
  { value: 'senior', label: 'Senior (5-10 ans)' },
  { value: 'lead', label: 'Lead/Expert (10+ ans)' },
]

const SOURCE_OPTIONS = [
  { value: 'INDEED', label: 'Indeed' },
  { value: 'HELLOWORK', label: 'HelloWork' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
]

type SearchStatus = 'idle' | 'launching' | 'scraping' | 'done'

export function SearchForm({ onSearchComplete }: { onSearchComplete: () => void }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [contractTypes, setContractTypes] = useState<string[]>([])
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [sources, setSources] = useState<string[]>(['INDEED', 'HELLOWORK', 'LINKEDIN'])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [jobsFound, setJobsFound] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim() || !location.trim()) {
      toast.error('Veuillez remplir le poste et la localisation')
      return
    }

    setStatus('launching')
    setJobsFound(0)

    try {
      const filters: SearchFilters = {
        contractTypes: contractTypes.filter(Boolean),
        remoteOnly,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        experienceLevel: experienceLevel || undefined,
        sources: sources as SearchFilters['sources'],
      }

      const { data } = await searchApi.createSearch({ query: query.trim(), location: location.trim(), ...filters })
      const searchId = data.search.id

      setStatus('scraping')
      toast('🔍 Recherche lancée, scraping en cours...', { duration: 4000 })

      // Poll every 5 seconds until done
      let attempts = 0
      const maxAttempts = 36 // 3 minutes max

      const poll = async () => {
        attempts++
        try {
          const { data: statusData } = await searchApi.pollStatus(searchId)
          setJobsFound(statusData.jobsFound)

          if (statusData.status === 'done') {
            setStatus('done')
            const msg = statusData.jobsFound > 0
              ? `✅ ${statusData.jobsFound} offres trouvées !`
              : '⚠️ Aucune offre trouvée pour cette recherche'
            toast.success(msg, { duration: 5000 })
            setTimeout(onSearchComplete, 1500)
            return
          }

          if (statusData.status === 'error') {
            setStatus('idle')
            toast.error(`Erreur: ${statusData.error || 'Scraping échoué'}`)
            return
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, 5000)
          } else {
            // Timeout — still redirect, jobs may have been saved partially
            setStatus('done')
            toast('⏱️ Timeout atteint, redirection...', { duration: 3000 })
            setTimeout(onSearchComplete, 1500)
          }
        } catch {
          if (attempts < maxAttempts) setTimeout(poll, 5000)
        }
      }

      setTimeout(poll, 5000)

    } catch (error: any) {
      setStatus('idle')
      const message = error.response?.data?.error || error.message || 'Erreur lors de la recherche'
      toast.error(message)
      console.error('Search error:', error)
    }
  }

  const toggleSource = (source: string) => {
    setSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source])
  }

  const isLoading = status === 'launching' || status === 'scraping'

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-600" />
        Nouvelle recherche
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Poste recherché"
          placeholder="Ex: Développeur React, Chef de projet..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          disabled={isLoading}
        />
        <Input
          label="Localisation"
          placeholder="Ex: Paris, Lyon, Remote, France..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleSource(value)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sources.includes(value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Select
          label="Type de contrat"
          options={CONTRACT_OPTIONS}
          value={contractTypes[0] || ''}
          onChange={(e) => setContractTypes(e.target.value ? [e.target.value] : [])}
        />
        <Select
          label="Niveau d'expérience"
          options={EXPERIENCE_OPTIONS}
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              disabled={isLoading}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Télétravail uniquement</span>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          type="number"
          label="Salaire minimum (€/an)"
          placeholder="40000"
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          disabled={isLoading}
        />
        <Input
          type="number"
          label="Salaire maximum (€/an)"
          placeholder="80000"
          value={salaryMax}
          onChange={(e) => setSalaryMax(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Status indicator */}
      {status === 'scraping' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Scraping en cours...</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {jobsFound > 0 ? `${jobsFound} offres trouvées jusqu'ici` : 'Interrogation de Indeed, HelloWork et LinkedIn'}
              </p>
            </div>
          </div>
          <div className="mt-3 w-full bg-blue-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Recherche terminée — {jobsFound} offres trouvées. Redirection...
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || status === 'done' || sources.length === 0}
      >
        {status === 'launching' ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Lancement...</>
        ) : status === 'scraping' ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scraping en cours...</>
        ) : (
          <><Search className="h-4 w-4 mr-2" />Lancer la recherche</>
        )}
      </Button>
    </form>
  )
}

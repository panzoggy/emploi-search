import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
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

export function SearchForm({ onSearchComplete }: { onSearchComplete: () => void }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [contractTypes, setContractTypes] = useState<string[]>([])
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [sources, setSources] = useState<string[]>(['INDEED', 'HELLOWORK', 'LINKEDIN'])
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || !location.trim()) {
      toast.error('Veuillez remplir le poste et la localisation')
      return
    }
    
    setLoading(true)
    
    try {
      const filters: SearchFilters = {
        contractTypes: contractTypes.filter(Boolean),
        remoteOnly,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        experienceLevel: experienceLevel || undefined,
        sources: sources as SearchFilters['sources'],
      }
      
      await searchApi.createSearch({ query: query.trim(), location: location.trim(), ...filters })
      toast.success('Recherche terminée !')
      onSearchComplete()
    } catch (error) {
      toast.error('Erreur lors de la recherche')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleSource = (source: string) => {
    setSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source])
  }
  
  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Search className="h-5 w-5 text-primary-600" />
        Nouvelle recherche
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Poste recherché"
          placeholder="Ex: Développeur React, Chef de projet..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <Input
          label="Localisation"
          placeholder="Ex: Paris, Lyon, Remote, France..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sources.includes(value)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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
          multiple
        />
        <Select
          label="Niveau d'expérience"
          options={EXPERIENCE_OPTIONS}
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
        />
        <Input
          type="number"
          label="Salaire maximum (€/an)"
          placeholder="80000"
          value={salaryMax}
          onChange={(e) => setSalaryMax(e.target.value)}
        />
      </div>
      
      <Button type="submit" className="w-full" loading={loading} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : ''}
        Lancer la recherche
      </Button>
    </form>
  )
}
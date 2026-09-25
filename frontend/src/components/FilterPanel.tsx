import { useMemo, useState } from 'react'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { Select } from './Select'
import { useJobStore } from '../store/jobStore'
import type { JobFilters } from '../types'

const SOURCE_OPTIONS = [
  { value: '', label: 'Toutes les sources' },
  { value: 'INDEED', label: 'Indeed' },
  { value: 'HELLOWORK', label: 'HelloWork' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
]

const VIEWED_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'viewed', label: 'Consultées' },
  { value: 'unviewed', label: 'Non consultées' },
]

const REJECTED_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'not_rejected', label: 'Non rejetées' },
]

const SORT_OPTIONS = [
  { value: 'postedAt', label: 'Date de publication' },
  { value: 'scrapedAt', label: 'Date de récupération' },
  { value: 'title', label: 'Titre' },
  { value: 'company', label: 'Entreprise' },
]

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

export function FilterPanel({ onSearch }: { onSearch: () => void }) {
  const { filters, setFilters, resetFilters } = useJobStore()
  const [expanded, setExpanded] = useState(false)
  
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false
      if (key === 'viewed' && value === 'unviewed') return false
      if (key === 'rejected' && value === 'not_rejected') return false
      return value !== '' && value !== undefined && value !== null
    })
  }, [filters])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }
  
  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {expanded && (
        <div className="space-y-4 animate-slide-down">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Entreprise"
              placeholder="Filtrer par entreprise"
              value={filters.company || ''}
              onChange={(e) => setFilters({ company: e.target.value })}
            />
            <Input
              label="Localisation"
              placeholder="Filtrer par ville/région"
              value={filters.location || ''}
              onChange={(e) => setFilters({ location: e.target.value })}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Source"
              options={SOURCE_OPTIONS}
              value={filters.source || ''}
              onChange={(e) => setFilters({ source: (e.target.value || undefined) as JobFilters['source'] })}
            />
            <Select
              label="Statut consulté"
              options={VIEWED_OPTIONS}
              value={filters.viewed || 'unviewed'}
              onChange={(e) => setFilters({ viewed: e.target.value as JobFilters['viewed'] })}
            />
            <Select
              label="Statut rejeté"
              options={REJECTED_OPTIONS}
              value={filters.rejected || 'not_rejected'}
              onChange={(e) => setFilters({ rejected: e.target.value as JobFilters['rejected'] })}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Type de contrat"
              options={CONTRACT_OPTIONS}
              value={filters.contractType || ''}
              onChange={(e) => setFilters({ contractType: e.target.value || undefined })}
            />
            <Select
              label="Niveau d'expérience"
              options={EXPERIENCE_OPTIONS}
              value={filters.experienceLevel || ''}
              onChange={(e) => setFilters({ experienceLevel: e.target.value || undefined })}
            />
            <Select
              label="Trier par"
              options={SORT_OPTIONS}
              value={filters.sortBy || 'postedAt'}
              onChange={(e) => setFilters({ sortBy: e.target.value as JobFilters['sortBy'] })}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="number"
              label="Salaire minimum (€/an)"
              placeholder="Ex: 40000"
              value={filters.salaryMin || ''}
              onChange={(e) => setFilters({ salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <Input
              type="number"
              label="Salaire maximum (€/an)"
              placeholder="Ex: 80000"
              value={filters.salaryMax || ''}
              onChange={(e) => setFilters({ salaryMax: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.remoteOnly}
                onChange={(e) => setFilters({ remoteOnly: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Télétravail uniquement</span>
            </label>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button type="submit" className="flex-1">
              Rechercher
            </Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
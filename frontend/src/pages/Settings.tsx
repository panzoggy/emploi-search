import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'
import { userApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import type { UserPreferences } from '../types'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance']
const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior (0-2 ans)' },
  { value: 'mid', label: 'Confirmé (2-5 ans)' },
  { value: 'senior', label: 'Senior (5-10 ans)' },
  { value: 'lead', label: 'Lead/Expert (10+ ans)' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    keywords: '' as string,
    locations: '' as string,
    contractTypes: [] as string[],
    remoteOnly: false,
    salaryMin: '' as string,
    salaryMax: '' as string,
    experienceLevel: '' as string,
  })
  
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await userApi.getPreferences()
        setPreferences(res.data)
        setFormData({
          keywords: res.data.keywords.join(', '),
          locations: res.data.locations.join(', '),
          contractTypes: res.data.contractTypes,
          remoteOnly: res.data.remoteOnly,
          salaryMin: res.data.salaryMin?.toString() || '',
          salaryMax: res.data.salaryMax?.toString() || '',
          experienceLevel: res.data.experienceLevel || '',
        })
      } catch (error) {
        toast.error('Erreur lors du chargement des préférences')
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await userApi.updatePreferences({
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        locations: formData.locations.split(',').map(l => l.trim()).filter(Boolean),
        contractTypes: formData.contractTypes,
        remoteOnly: formData.remoteOnly,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        experienceLevel: formData.experienceLevel || undefined,
      })
      toast.success('Préférences enregistrées')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }
  
  const toggleContractType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      contractTypes: prev.contractTypes.includes(type)
        ? prev.contractTypes.filter(t => t !== type)
        : [...prev.contractTypes, type],
    }))
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 mt-1">Gérez vos préférences de recherche et votre compte</p>
        </div>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil</h2>
            <div className="space-y-4">
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                helperText="L'email ne peut pas être modifié"
              />
              <Input
                label="Nom"
                value={user?.name || ''}
                disabled
              />
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Préférences de recherche</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ces préférences seront utilisées pour pré-remplir vos futures recherches.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés favoris</label>
                <Input
                  placeholder="développeur, react, node.js, fullstack..."
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  helperText="Séparez par des virgules"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisations favorites</label>
                <Input
                  placeholder="Paris, Lyon, Remote, Télétravail..."
                  value={formData.locations}
                  onChange={(e) => setFormData(prev => ({ ...prev, locations: e.target.value }))}
                  helperText="Séparez par des virgules"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Types de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleContractType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.contractTypes.includes(type)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'expérience</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="input max-w-xs"
                >
                  <option value="">Tous niveaux</option>
                  {EXPERIENCE_LEVELS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Salaire minimum (€/an)"
                  placeholder="40000"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                />
                <Input
                  type="number"
                  label="Salaire maximum (€/an)"
                  placeholder="80000"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remoteOnly"
                  checked={formData.remoteOnly}
                  onChange={(e) => setFormData(prev => ({ ...prev, remoteOnly: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remoteOnly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Télétravail uniquement
                </label>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                Enregistrer les préférences
              </Button>
            </div>
          </Card>
          
          <Card className="p-6 border-red-200">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Zone de danger</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ces actions sont irréversibles. Utilisez-les avec précaution.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="destructive" onClick={() => { if (confirm('Supprimer tout l\'historique des recherches ?')) { /* TODO */ toast.info('Non implémenté') } }}>
                Supprimer l'historique
              </Button>
              <Button variant="destructive" onClick={() => { if (confirm('Supprimer toutes les offres rejetées ?')) { /* TODO */ toast.info('Non implémenté') } }}>
                Réinitialiser les rejets
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
import { Header } from '../components/Header'
import { SearchForm } from '../components/SearchForm'
import { Card } from '../components/Card'

export function SearchPage() {
  const handleSearchComplete = () => {
    window.location.href = '/'
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle recherche</h1>
          <p className="text-gray-500 mt-1">Recherchez des offres sur Indeed, HelloWork et LinkedIn</p>
        </div>
        
        <SearchForm onSearchComplete={handleSearchComplete} />
        
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Conseils de recherche</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Utilisez des mots-clés précis : "Développeur React", "Chef de projet IT"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                La localisation peut être une ville, une région ou "Remote"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                Les résultats excluent automatiquement les offres déjà consultées ou rejetées
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                La recherche peut prendre 30-60 secondes selon les sources sélectionnées
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
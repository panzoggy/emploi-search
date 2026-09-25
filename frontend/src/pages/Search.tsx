import { SearchForm } from '../components/SearchForm'
import { Card } from '../components/Card'
import { useNavigate } from 'react-router-dom'

export function SearchPage() {
  const navigate = useNavigate()

  const handleSearchComplete = () => {
    navigate('/')
  }

  return (
    <>
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
              <span className="text-blue-600">•</span>
              Utilisez des mots-clés précis : "Développeur React", "Chef de projet IT"
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              La localisation peut être une ville, une région ou "Remote"
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              Les offres rejetées n'apparaissent plus dans votre tableau de bord
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              La recherche tourne en arrière-plan — vous serez redirigé automatiquement
            </li>
          </ul>
        </Card>
      </div>
    </>
  )
}

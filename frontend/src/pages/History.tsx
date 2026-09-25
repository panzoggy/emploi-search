import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Search, Loader2, Eye, X } from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { Pagination } from '../components/Pagination'
import { Card } from '../components/Card'
import { searchApi } from '../services/api'
import { jobsApi } from '../services/api'
import toast from 'react-hot-toast'
import type { Search as SearchType, Job } from '../types'

export function HistoryPage() {
  const [searches, setSearches] = useState<SearchType[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [expandedSearchId, setExpandedSearchId] = useState<string | null>(null)
  
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await searchApi.getHistory(pagination.page, pagination.limit)
      setSearches(res.data.searches)
      setPagination(prev => ({
        ...prev,
        page: res.data.pagination.page,
        total: res.data.pagination.total,
        totalPages: res.data.pagination.totalPages,
      }))
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchHistory()
  }, [pagination.page])
  
  const handleViewJob = async (jobId: string) => {
    try {
      await jobsApi.viewJob(jobId)
      setSearches(prev => prev.map(search => ({
        ...search,
        results: search.results?.map(job => 
          job.id === jobId ? { ...job, viewed: true, viewedAt: new Date().toISOString() } : job
        ) || []
      })))
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handleRejectJob = async (jobId: string) => {
    const reason = prompt('Raison du rejet (optionnel):')
    try {
      await jobsApi.rejectJob(jobId, reason || undefined)
      setSearches(prev => prev.map(search => ({
        ...search,
        results: search.results?.map(job => 
          job.id === jobId ? { ...job, rejected: true, rejectedAt: new Date().toISOString(), rejectionReason: reason } : job
        ) || []
      })))
      toast.success('Offre rejetée')
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handleUnrejectJob = async (jobId: string) => {
    try {
      await jobsApi.unrejectJob(jobId)
      setSearches(prev => prev.map(search => ({
        ...search,
        results: search.results?.map(job => 
          job.id === jobId ? { ...job, rejected: false, rejectedAt: undefined, rejectionReason: undefined } : job
        ) || []
      })))
      toast.success('Rejet annulé')
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }
  
  const sourceLabels = {
    INDEED: 'Indeed',
    HELLOWORK: 'HelloWork',
    LINKEDIN: 'LinkedIn',
  }
  
  const sourceColors = {
    INDEED: 'bg-blue-100 text-blue-800',
    HELLOWORK: 'bg-green-100 text-green-800',
    LINKEDIN: 'bg-blue-600 bg-opacity-10 text-blue-800',
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Historique des recherches</h1>
          <p className="text-gray-500 mt-1">Retrouvez vos recherches passées et leurs résultats</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : searches.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune recherche</h3>
            <p className="mt-1 text-gray-500">Lancez votre première recherche pour voir l'historique ici</p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {searches.map((search) => {
                const isExpanded = expandedSearchId === search.id
                const results = search.results || []
                const viewedCount = results.filter(j => j.viewed).length
                const rejectedCount = results.filter(j => j.rejected).length
                const newCount = results.filter(j => !j.viewed && !j.rejected).length
                
                return (
                  <Card key={search.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedSearchId(isExpanded ? null : search.id)}
                      className="w-full p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">"{search.query}"</h3>
                          <span className="text-sm text-gray-500">à</span>
                          <span className="text-sm text-gray-500">{search.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{format(new Date(search.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                          <span>•</span>
                          <span>{search._count?.results || results.length} offres</span>
                          <span>•</span>
                          <span className="text-green-600">{newCount} nouvelles</span>
                          <span>•</span>
                          <span className="text-purple-600">{viewedCount} vues</span>
                          <span>•</span>
                          <span className="text-red-600">{rejectedCount} rejetées</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {search.filters.sources?.map((source: string) => (
                          <span
                            key={source}
                            className={`badge text-xs ${sourceColors[source as keyof typeof sourceColors]}`}
                          >
                            {sourceLabels[source as keyof typeof sourceLabels]}
                          </span>
                        ))}
                        {isExpanded ? (
                          <Eye className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t p-4 bg-gray-50">
                        {results.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">Aucun résultat pour cette recherche</p>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {results.map((job) => (
                              <div
                                key={job.id}
                                className={`flex items-start justify-between gap-4 p-3 bg-white rounded-lg border ${
                                  job.rejected ? 'opacity-50 bg-gray-50' : ''
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`badge text-xs ${sourceColors[job.source]}`}>
                                      {sourceLabels[job.source]}
                                    </span>
                                    {job.viewed && <Eye className="h-3.5 w-3.5 text-gray-400" />}
                                    {job.rejected && <X className="h-3.5 w-3.5 text-red-500" />}
                                  </div>
                                  <h4 className={`font-medium text-gray-900 truncate ${job.rejected ? 'line-through text-gray-500' : ''}`}>
                                    {job.title}
                                  </h4>
                                  <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {job.rejected ? (
                                    <Button variant="ghost" size="sm" onClick={() => handleUnrejectJob(job.id)}>
                                      Annuler
                                    </Button>
                                  ) : (
                                    <>
                                      {!job.viewed && (
                                        <Button variant="outline" size="sm" onClick={() => handleViewJob(job.id)}>
                                          <Eye className="h-3.5 w-3.5 mr-1" /> Vu
                                        </Button>
                                      )}
                                      <Button variant="outline" size="sm" onClick={() => handleRejectJob(job.id)}>
                                        <X className="h-3.5 w-3.5 mr-1" /> Non
                                      </Button>
                                    </>
                                  )}
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                  >
                                    Voir
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
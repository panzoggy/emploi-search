import { useEffect, useState } from 'react'
import { useJobStore } from '../store/jobStore'
import { jobsApi } from '../services/api'
import { FilterPanel } from '../components/FilterPanel'
import { JobCard } from '../components/JobCard'
import { Pagination } from '../components/Pagination'
import { StatsCards } from '../components/StatsCards'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '../components/Button'
import toast from 'react-hot-toast'
import type { Job } from '../types'

export function Dashboard() {
  const { filters, setFilters, viewMode, setViewMode } = useJobStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<{
    total: number
    viewed: number
    rejected: number
    unviewed: number
    newToday: number
    bySource: { source: string; count: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  
  const fetchJobs = async () => {
    setLoading(true)
    try {
      const [jobsRes, statsRes] = await Promise.all([
        jobsApi.getJobs(filters),
        jobsApi.getStats(),
      ])
      setJobs(jobsRes.data.jobs)
      setStats(statsRes.data)
      setPagination(prev => ({
        ...prev,
        page: jobsRes.data.pagination.page,
        total: jobsRes.data.pagination.total,
        totalPages: jobsRes.data.pagination.totalPages,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erreur lors du chargement des offres'
      toast.error(message)
      console.error('Fetch jobs error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchStats = async () => {
    try {
      const res = await jobsApi.getStats()
      setStats(res.data)
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erreur lors du chargement des stats'
      console.error('Fetch stats error:', error)
    }
  }
  
  useEffect(() => {
    fetchJobs()
    fetchStats()
  }, [filters])
  
  const handleView = async (jobId: string) => {
    try {
      await jobsApi.viewJob(jobId)
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, viewed: true, viewedAt: new Date().toISOString() } : job
      ))
      fetchStats()
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handleReject = async (jobId: string) => {
    const reason = prompt('Raison du rejet (optionnel):')
    try {
      await jobsApi.rejectJob(jobId, reason || undefined)
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, rejected: true, rejectedAt: new Date().toISOString(), rejectionReason: reason || null } : job
      ))
      fetchStats()
      toast.success('Offre rejetée')
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handleUnreject = async (jobId: string) => {
    try {
      await jobsApi.unrejectJob(jobId)
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, rejected: false, rejectedAt: undefined, rejectionReason: undefined } : job
      ))
      fetchStats()
      toast.success('Rejet annulé')
    } catch (error) {
      toast.error('Erreur')
    }
  }
  
  const handlePageChange = (page: number) => {
    setFilters({ page })
  }
  
  const handleRefresh = () => {
    fetchJobs()
    fetchStats()
  }
  
  return (
    <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Gérez et filtrez vos offres d'emploi</p>
        </div>
        
        {stats && <StatsCards stats={stats} />}
        
        <div className="grid gap-6 lg:grid-cols-4 mt-6">
          <aside className="lg:col-span-1">
            <FilterPanel onSearch={fetchJobs} />
          </aside>
          
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  aria-label="Vue liste"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  aria-label="Vue grille"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="card p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune offre trouvée</h3>
                <p className="mt-1 text-gray-500">Essayez de modifier vos filtres ou lancez une nouvelle recherche</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onView={handleView}
                      onReject={handleReject}
                      onUnreject={handleUnreject}
                      viewMode={viewMode}
                    />
                  ))}
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
          </div>
        </div>
    </>
  )
}
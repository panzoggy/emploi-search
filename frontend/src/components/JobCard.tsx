import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExternalLink, Eye, X, Briefcase, MapPin, Euro, Clock, Home } from 'lucide-react'
import { cn } from '../utils/cn'
import type { Job } from '../types'
import { Button } from './Button'

interface JobCardProps {
  job: Job
  onView: (jobId: string) => void
  onReject: (jobId: string) => void
  onUnreject: (jobId: string) => void
  viewMode?: 'list' | 'grid'
}

export function JobCard({ job, onView, onReject, onUnreject, viewMode = 'list' }: JobCardProps) {
  const isViewed = job.viewed
  const isRejected = job.rejected
  
  const sourceColors = {
    INDEED: 'bg-blue-100 text-blue-800',
    HELLOWORK: 'bg-green-100 text-green-800',
    LINKEDIN: 'bg-blue-600 text-white bg-opacity-10 text-blue-800',
  }
  
  const sourceLabels = {
    INDEED: 'Indeed',
    HELLOWORK: 'HelloWork',
    LINKEDIN: 'LinkedIn',
  }
  
  if (viewMode === 'grid') {
    return (
      <div className={cn('card p-4 transition-all hover:shadow-md', isRejected && 'opacity-50 bg-gray-50')}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={cn('badge text-xs', sourceColors[job.source])}>
            {sourceLabels[job.source]}
          </span>
          <div className="flex items-center gap-1">
            {isViewed && <Eye className="h-4 w-4 text-gray-400" title="Vu" />}
            {isRejected && <X className="h-4 w-4 text-red-500" title="Rejeté" />}
          </div>
        </div>
        <h3 className={cn('font-semibold text-gray-900 mb-1 line-clamp-2', isRejected && 'line-through text-gray-500')}>
          {job.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">{job.company}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          {job.contractType && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {job.contractType}
            </span>
          )}
          {job.salaryMin && (
            <span className="flex items-center gap-1">
              <Euro className="h-3.5 w-3.5" />
              {job.salaryMin.toLocaleString()}€
              {job.salaryMax && ` - ${job.salaryMax.toLocaleString()}€`}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-gray-400">
            {job.postedAt ? formatDistanceToNow(new Date(job.postedAt), { addSuffix: true, locale: fr }) : 'Date inconnue'}
          </span>
          <div className="flex items-center gap-2">
            {isRejected ? (
              <Button variant="ghost" size="sm" onClick={() => onUnreject(job.id)}>
                Annuler
              </Button>
            ) : (
              <>
                {!isViewed && (
                  <Button variant="outline" size="sm" onClick={() => onView(job.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Vu
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onReject(job.id)}>
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
              Voir <ExternalLink className="h-3.5 w-3.5 ml-1 inline" />
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn('card p-4 transition-all hover:shadow-md', isRejected && 'opacity-50 bg-gray-50')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('badge', sourceColors[job.source])}>
              {sourceLabels[job.source]}
            </span>
            {isViewed && <Eye className="h-4 w-4 text-gray-400" title="Vu" />}
            {isRejected && <X className="h-4 w-4 text-red-500" title="Rejeté" />}
          </div>
          <h3 className={cn('font-semibold text-gray-900 mb-1', isRejected && 'line-through text-gray-500')}>
            {job.title}
          </h3>
          <p className="text-gray-600 mb-2">{job.company}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            {job.contractType && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.contractType}
              </span>
            )}
            {job.remoteType && (
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                {job.remoteType}
              </span>
            )}
            {job.salaryMin && (
              <span className="flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                {job.salaryMin.toLocaleString()}€
                {job.salaryMax && ` - ${job.salaryMax.toLocaleString()}€`}
              </span>
            )}
          </div>
          {job.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {job.postedAt ? formatDistanceToNow(new Date(job.postedAt), { addSuffix: true, locale: fr }) : 'Date inconnue'}
          </span>
          <div className="flex items-center gap-2">
            {isRejected ? (
              <Button variant="ghost" size="sm" onClick={() => onUnreject(job.id)}>
                Annuler le rejet
              </Button>
            ) : (
              <>
                {!isViewed && (
                  <Button variant="outline" size="sm" onClick={() => onView(job.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Marquer comme vu
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onReject(job.id)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Pas intéressé
                </Button>
              </>
            )}
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm px-3 py-1.5"
            >
              Voir l'offre <ExternalLink className="h-3.5 w-3.5 ml-1 inline" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
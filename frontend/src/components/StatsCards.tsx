import { Eye, X, Plus, Briefcase, MapPin, TrendingUp } from 'lucide-react'
import { cn } from '../utils/cn'
import type { JobStats } from '../types'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {trend !== undefined && (
            <p className={cn('text-sm mt-1', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              <TrendingUp className="h-3.5 w-3.5 inline" />
              {trend >= 0 ? '+' : ''}{trend}% vs semaine dernière
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', color)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function StatsCards({ stats }: { stats: JobStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total offres"
        value={stats.total}
        icon={<Briefcase className="h-6 w-6" />}
        color="bg-blue-100 text-blue-600"
      />
      <StatCard
        title="Nouvelles aujourd'hui"
        value={stats.newToday}
        icon={<Plus className="h-6 w-6" />}
        color="bg-green-100 text-green-600"
        trend={stats.newToday > 0 ? 100 : 0}
      />
      <StatCard
        title="Non consultées"
        value={stats.unviewed}
        icon={<Eye className="h-6 w-6" />}
        color="bg-purple-100 text-purple-600"
      />
      <StatCard
        title="Rejetées"
        value={stats.rejected}
        icon={<X className="h-6 w-6" />}
        color="bg-red-100 text-red-600"
      />
      <StatCard
        title="Consultées"
        value={stats.viewed}
        icon={<MapPin className="h-6 w-6" />}
        color="bg-orange-100 text-orange-600"
      />
    </div>
  )
}

export function SourceStats({ stats }: { stats: JobStats }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Répartition par source</h3>
      <div className="space-y-3">
        {stats.bySource.map(({ source, count }) => {
          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
          const colors = {
            INDEED: 'bg-blue-500',
            HELLOWORK: 'bg-green-500',
            LINKEDIN: 'bg-blue-600',
          }
          const labels = {
            INDEED: 'Indeed',
            HELLOWORK: 'HelloWork',
            LINKEDIN: 'LinkedIn',
          }
          return (
            <div key={source} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-700">{labels[source as keyof typeof labels]}</div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', colors[source as keyof typeof colors])}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-sm text-gray-500 text-right">
                {count} ({percentage}%)
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
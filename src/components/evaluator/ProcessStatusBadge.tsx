import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ProcessStatus = 'active' | 'completed' | 'archived' | 'in_progress' | 'closed' | 'draft' | string

interface ProcessStatusBadgeProps {
  status?: ProcessStatus | null
  className?: string
}

export function ProcessStatusBadge({ status, className }: ProcessStatusBadgeProps) {
  const normalized = (status || 'active').toLowerCase()

  if (normalized === 'completed') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 font-medium',
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />
        Completado
      </Badge>
    )
  }

  if (normalized === 'in_progress') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 font-medium',
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-amber-500 mr-1 inline-block animate-pulse" />
        En Progreso
      </Badge>
    )
  }

  if (normalized === 'closed' || normalized === 'archived') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700 font-medium',
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-slate-400 mr-1 inline-block" />
        {normalized === 'archived' ? 'Archivado' : 'Cerrado'}
      </Badge>
    )
  }

  // Default: active / draft
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800 font-medium',
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-blue-500 mr-1 inline-block" />
      {normalized === 'draft' ? 'Borrador' : 'Activo'}
    </Badge>
  )
}

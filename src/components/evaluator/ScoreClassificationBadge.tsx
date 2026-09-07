import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScoreClassificationBadgeProps {
  classification?: string | null
  score?: number | null
  className?: string
}

export function ScoreClassificationBadge({
  classification,
  className,
}: ScoreClassificationBadgeProps) {
  if (!classification) {
    return (
      <Badge
        variant="outline"
        className={cn('bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 font-normal', className)}
      >
        Sin clasificar
      </Badge>
    )
  }

  const text = classification.trim()
  const lower = text.toLowerCase()

  if (lower.includes('listo') || lower.includes('experto')) {
    return (
      <Badge
        className={cn('bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs border-transparent', className)}
      >
        {text}
      </Badge>
    )
  }

  if (lower.includes('nivelación') || lower.includes('nivelacion') || lower.includes('avanzado')) {
    return (
      <Badge
        className={cn('bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-xs border-transparent', className)}
      >
        {text}
      </Badge>
    )
  }

  if (lower.includes('preparación') || lower.includes('preparacion') || lower.includes('intermedio') || lower.includes('desarrollo')) {
    return (
      <Badge
        className={cn('bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-xs border-transparent', className)}
      >
        {text}
      </Badge>
    )
  }

  // Default: Continúa en rol actual / No Cumple Perfil Experto / Rojo
  return (
    <Badge
      className={cn('bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs border-transparent', className)}
    >
      {text}
    </Badge>
  )
}

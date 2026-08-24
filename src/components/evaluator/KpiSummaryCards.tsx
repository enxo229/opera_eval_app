'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, PlayCircle, CheckCircle2 } from 'lucide-react'

export interface EvaluatorKpis {
  totalCandidates: number
  totalEvaluators: number
  activeEvaluations: number
  completedEvaluations: number
  readyCandidatesCount?: number
}

interface KpiSummaryCardsProps {
  kpis: EvaluatorKpis
  loading?: boolean
}

export function KpiSummaryCards({ kpis, loading = false }: KpiSummaryCardsProps) {
  const cards = [
    {
      id: 'candidates',
      title: 'Total Candidatos',
      value: kpis.totalCandidates,
      subtitle: 'Registrados en el sistema',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      borderColor: 'border-blue-200/60 dark:border-blue-900/40',
    },
    {
      id: 'evaluators',
      title: 'Total Evaluadores',
      value: kpis.totalEvaluators,
      subtitle: 'Con permisos activos',
      icon: UserCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      borderColor: 'border-purple-200/60 dark:border-purple-900/40',
    },
    {
      id: 'active',
      title: 'Procesos Activos',
      value: kpis.activeEvaluations,
      subtitle: 'En progreso o pendientes',
      icon: PlayCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
      borderColor: 'border-amber-200/60 dark:border-amber-900/40',
    },
    {
      id: 'completed',
      title: 'Evaluaciones Finalizadas',
      value: kpis.completedEvaluations,
      subtitle: `${kpis.readyCandidatesCount ?? 0} listos para pivotar`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200/60 dark:border-emerald-900/40',
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <motion.div key={card.id} variants={item}>
            <Card className={`relative overflow-hidden border ${card.borderColor} bg-card shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {loading ? (
                      <span className="inline-block h-8 w-12 bg-muted animate-pulse rounded-md" />
                    ) : (
                      card.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/90">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color} shrink-0`}>
                  <IconComponent className="size-5 sm:size-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

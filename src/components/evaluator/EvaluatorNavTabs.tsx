'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, History, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EvaluatorNavTabs() {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/evaluator',
      label: 'Vista General',
      icon: LayoutDashboard,
      isActive: pathname === '/evaluator',
    },
    {
      href: '/evaluator/history',
      label: 'Búsqueda Histórica',
      icon: History,
      isActive: pathname === '/evaluator/history',
    },
    {
      href: '/evaluator/teams',
      label: 'Equipos & Squads',
      icon: Layers,
      isActive: pathname === '/evaluator/teams',
    },
  ]

  return (
    <nav className="flex items-center gap-1 border-b border-border/80 px-6 bg-card/60 backdrop-blur-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-150',
              tab.isActive
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            <Icon className="size-4" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'

export interface ExportRow {
  fullName: string
  email: string
  nationalId?: string | null
  team?: string | null
  status: string
  finalScore?: number | null
  classification?: string | null
  createdAt?: string
}

interface ExportMenuProps {
  data: ExportRow[]
  filename?: string
}

export function ExportMenu({ data, filename = 'reporte_evaluaciones_o11y' }: ExportMenuProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) return

    const headers = [
      'Nombre Completo',
      'Correo Electrónico',
      'Identificación',
      'Equipo / Squad',
      'Estado',
      'Puntaje Final',
      'Clasificación',
      'Fecha Creación',
    ]

    const csvRows = [
      headers.join(';'),
      ...data.map((row) =>
        [
          `"${(row.fullName || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${(row.nationalId || '').replace(/"/g, '""')}"`,
          `"${(row.team || '').replace(/"/g, '""')}"`,
          `"${(row.status || '').replace(/"/g, '""')}"`,
          `"${row.finalScore !== null && row.finalScore !== undefined ? row.finalScore : ''}"`,
          `"${(row.classification || 'Sin clasificar').replace(/"/g, '""')}"`,
          `"${row.createdAt ? new Date(row.createdAt).toLocaleDateString('es-CO') : ''}"`,
        ].join(';')
      ),
    ]

    const csvContent = '\uFEFF' + csvRows.join('\n') // UTF-8 BOM for Excel support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
            <Download className="size-3.5" />
            <span>Exportar</span>
          </Button>
        }
      />
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          <span>Exportar a Excel / CSV</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
          <Printer className="size-4 text-blue-600" />
          <span>Imprimir / PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

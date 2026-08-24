'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProcessStatusBadge } from '@/components/evaluator/ProcessStatusBadge'
import { ScoreClassificationBadge } from '@/components/evaluator/ScoreClassificationBadge'
import { ExportMenu, ExportRow } from '@/components/evaluator/ExportMenu'
import { closeSelectionProcess, reopenEvaluation } from '@/app/actions/admin'
import {
  Search,
  MoreVertical,
  PlayCircle,
  FileText,
  Lock,
  RotateCcw,
  Users,
  X,
  Loader2,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

export interface CandidateRowData {
  id: string
  fullName: string
  email: string
  nationalId?: string | null
  nationalIdType?: string | null
  team?: string | null
  trackId?: string | null
  processId?: string | null
  processStatus?: string | null
  evaluationId?: string | null
  evaluationStatus?: string | null
  finalScore?: number | null
  classification?: string | null
  createdAt?: string
}

interface CandidatesDataTableProps {
  data: CandidateRowData[]
  teams?: string[]
  loading?: boolean
  onDataChange?: () => void
}

export function CandidatesDataTable({
  data,
  teams = [],
  loading = false,
  onDataChange,
}: CandidatesDataTableProps) {
  const router = useRouter()

  // Filters State: Defaults to 'active' (Activos / Borrador)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [teamFilter, setTeamFilter] = useState<string>('ALL')

  // Action Modals State
  const [processToClose, setProcessToClose] = useState<{ id: string; name: string } | null>(null)
  const [evalToReopen, setEvalToReopen] = useState<{ id: string; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Extract distinct teams from data if not provided
  const availableTeams = useMemo(() => {
    const set = new Set<string>(teams)
    data.forEach((row) => {
      if (row.team && row.team.trim()) {
        set.add(row.team.trim())
      }
    })
    return Array.from(set).sort()
  }, [data, teams])

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Search Query
      const query = debouncedSearch.toLowerCase().trim()
      if (query) {
        const textToSearch = `${row.fullName || ''} ${row.email || ''} ${row.nationalId || ''} ${row.team || ''}`.toLowerCase()
        if (!textToSearch.includes(query)) return false
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const status = (row.processStatus || row.evaluationStatus || 'draft').toLowerCase()
        if (statusFilter === 'active') {
          // Matches any active, draft or in-progress evaluation
          const isOngoing = status === 'active' || status === 'draft' || status === 'in_progress'
          if (!isOngoing) return false
        } else if (statusFilter === 'in_progress') {
          if (status !== 'in_progress') return false
        } else if (statusFilter === 'completed') {
          if (status !== 'completed') return false
        } else if (statusFilter === 'closed') {
          if (status !== 'closed' && status !== 'archived') return false
        }
      }

      // 3. Team Filter
      if (teamFilter !== 'ALL') {
        if ((row.team || '').trim() !== teamFilter) return false
      }

      return true
    })
  }, [data, debouncedSearch, statusFilter, teamFilter])

  // Prepare data for ExportMenu
  const exportRows: ExportRow[] = useMemo(() => {
    return filteredData.map((row) => ({
      fullName: row.fullName,
      email: row.email,
      nationalId: row.nationalId ? `${row.nationalIdType || 'CC'} ${row.nationalId}` : '',
      team: row.team,
      status: row.processStatus || row.evaluationStatus || 'activo',
      finalScore: row.finalScore,
      classification: row.classification,
      createdAt: row.createdAt,
    }))
  }, [filteredData])

  const handleCloseConfirm = async () => {
    if (!processToClose) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await closeSelectionProcess(processToClose.id)
      if (res.success) {
        setProcessToClose(null)
        onDataChange?.()
        router.refresh()
      } else {
        setActionError(res.error || 'Error al cerrar el proceso.')
      }
    } catch (e: any) {
      setActionError(e.message || 'Error de conexión.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopenConfirm = async () => {
    if (!evalToReopen) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await reopenEvaluation(evalToReopen.id)
      if (res.success) {
        setEvalToReopen(null)
        onDataChange?.()
        router.refresh()
      } else {
        setActionError(res.error || 'Error al reabrir la evaluación.')
      }
    } catch (e: any) {
      setActionError(e.message || 'Error de conexión.')
    } finally {
      setActionLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setStatusFilter('active')
    setTeamFilter('ALL')
  }

  const hasNonDefaultFilters = searchTerm !== '' || statusFilter !== 'active' || teamFilter !== 'ALL'

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border shadow-2xs">
        {/* Search input with debounce */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 text-sm h-9 bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-40">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as string)}>
              <SelectTrigger className="h-9 text-xs font-medium">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos / Borrador</SelectItem>
                <SelectItem value="ALL">Todos los Estados ({data.length})</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="closed">Cerrados / Archivados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter */}
          <div className="w-44">
            <Select value={teamFilter} onValueChange={(val) => setTeamFilter(val as string)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Equipo / Squad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Equipos</SelectItem>
                {availableTeams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button */}
          {hasNonDefaultFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <RotateCcw className="size-3" />
              Restablecer
            </Button>
          )}

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* Export Menu */}
          <ExportMenu data={exportRows} />
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs py-3.5">Candidato / Identificación</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Equipo / Squad</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Estado</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Score & Clasificación</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Fecha Registro</TableHead>
                <TableHead className="text-right font-semibold text-xs py-3.5 pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Cargando evaluaciones...</p>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium">
                      {statusFilter === 'active'
                        ? 'No hay evaluaciones activas o en borrador en este momento'
                        : 'No se encontraron candidatos con los filtros seleccionados'}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {statusFilter === 'active' ? (
                        <span>
                          Puedes cambiar el filtro a{' '}
                          <button
                            onClick={() => setStatusFilter('ALL')}
                            className="text-primary underline font-medium hover:text-primary/80"
                          >
                            Todos los Estados
                          </button>{' '}
                          para ver los {data.length} candidatos históricos o crear uno nuevo arriba.
                        </span>
                      ) : (
                        'Intenta ajustar los criterios de búsqueda.'
                      )}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((candidate) => {
                  const isCompleted = candidate.evaluationStatus === 'completed' || candidate.processStatus === 'completed'
                  const isClosed = candidate.processStatus === 'archived' || candidate.processStatus === 'closed'
                  const finalScore = candidate.finalScore

                  return (
                    <TableRow
                      key={candidate.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Candidato info */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs uppercase shrink-0">
                            {candidate.fullName ? candidate.fullName.charAt(0) : candidate.email.charAt(0)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <span>{candidate.fullName || 'Candidato Sin Nombre'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{candidate.email}</span>
                              {candidate.nationalId && (
                                <>
                                  <span className="text-muted-foreground/40">•</span>
                                  <span className="font-mono text-[11px]">
                                    {candidate.nationalIdType || 'CC'}: {candidate.nationalId}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Equipo */}
                      <TableCell className="py-3">
                        <span className="text-xs font-medium text-foreground/90 bg-muted/60 px-2.5 py-1 rounded-md border">
                          {candidate.team || 'Sin asignar'}
                        </span>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3">
                        <ProcessStatusBadge
                          status={
                            isClosed
                              ? 'closed'
                              : isCompleted
                              ? 'completed'
                              : candidate.evaluationStatus || candidate.processStatus || 'active'
                          }
                        />
                      </TableCell>

                      {/* Score y Clasificación */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {finalScore !== null && finalScore !== undefined ? (
                              <span className="font-mono font-bold text-sm text-foreground">
                                {finalScore.toFixed(1)} / 100
                              </span>
                            ) : null}
                            <ScoreClassificationBadge
                              classification={candidate.classification}
                              score={finalScore}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Fecha de Creación */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          <span>
                            {candidate.createdAt
                              ? new Date(candidate.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Reciente'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón de acción primaria contextual */}
                          {isCompleted ? (
                            <Link href={`/evaluator/report/${candidate.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <FileText className="size-3.5" />
                                <span>Ver Reporte</span>
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/evaluator/evaluate/${candidate.id}`}>
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                              >
                                <PlayCircle className="size-3.5" />
                                <span>Evaluar</span>
                              </Button>
                            </Link>
                          )}

                          {/* Menú Contextual de opciones extra */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-8 text-muted-foreground hover:text-foreground"
                                  aria-label="Más acciones"
                                />
                              }
                            >
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuLabel>Acciones del Proceso</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => router.push(`/evaluator/evaluate/${candidate.id}`)}
                                className="gap-2 cursor-pointer"
                              >
                                <PlayCircle className="size-4 text-blue-600" />
                                <span>Panel de Evaluación</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => router.push(`/evaluator/report/${candidate.id}`)}
                                className="gap-2 cursor-pointer"
                              >
                                <FileText className="size-4 text-emerald-600" />
                                <span>Ver Informe / Métricas</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {candidate.processId && !isClosed && (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    setProcessToClose({
                                      id: candidate.processId!,
                                      name: candidate.fullName || candidate.email,
                                    })
                                  }
                                  className="gap-2 cursor-pointer"
                                >
                                  <Lock className="size-4" />
                                  <span>Cerrar / Archivar Proceso</span>
                                </DropdownMenuItem>
                              )}

                              {candidate.evaluationId && isCompleted && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEvalToReopen({
                                      id: candidate.evaluationId!,
                                      name: candidate.fullName || candidate.email,
                                    })
                                  }
                                  className="gap-2 cursor-pointer text-amber-600 hover:text-amber-700"
                                >
                                  <RotateCcw className="size-4" />
                                  <span>Reabrir Evaluación</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer Stats */}
        <div className="px-4 py-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>
            Mostrando <strong className="text-foreground">{filteredData.length}</strong> de{' '}
            <strong className="text-foreground">{data.length}</strong> candidatos registrados
          </span>
          <div className="flex items-center gap-2">
            {statusFilter === 'active' ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Filtro predeterminado: Activos / Borrador
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Filtro personalizado: {statusFilter}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Cerrar Proceso */}
      <AlertDialog
        open={Boolean(processToClose)}
        onOpenChange={(open) => !open && setProcessToClose(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>¿Cerrar proceso de selección?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Estás a punto de cerrar y archivar el proceso para{' '}
              <strong>{processToClose?.name}</strong>.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Esta acción invalidará la sesión activa del candidato y bloqueará su acceso a la
                prueba técnica.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{actionError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCloseConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirmar y Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal: Reabrir Evaluación */}
      <AlertDialog
        open={Boolean(evalToReopen)}
        onOpenChange={(open) => !open && setEvalToReopen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="size-5" />
              <AlertDialogTitle>¿Reabrir evaluación completada?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Estás a punto de reabrir la evaluación para <strong>{evalToReopen?.name}</strong>.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                El estado se restablecerá a <strong>Borrador / Activo</strong>, permitiendo al
                evaluador recalificar y al candidato reingresar si es necesario.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{actionError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={handleReopenConfirm}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirmar y Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

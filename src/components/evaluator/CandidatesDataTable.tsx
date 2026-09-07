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
import { ChangePasswordDialog, PasswordTargetUser } from '@/components/evaluator/ChangePasswordDialog'
import { EditUserDialog, EditableUser } from '@/components/evaluator/EditUserDialog'
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
  ChevronLeft,
  ChevronRight,
  KeyRound,
  UserCog,
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Action Modals State
  const [processToClose, setProcessToClose] = useState<{ id: string; name: string } | null>(null)
  const [evalToReopen, setEvalToReopen] = useState<{ id: string; name: string } | null>(null)
  const [userToChangePassword, setUserToChangePassword] = useState<PasswordTargetUser | null>(null)
  const [userToEdit, setUserToEdit] = useState<EditableUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, teamFilter, pageSize])

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

  // Pagination slicing
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    if (pageSize >= 999) return filteredData
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

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
    setCurrentPage(1)
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

      {/* Candidates Data Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs py-3.5 pl-4 min-w-[220px]">
                  Candidato / Identificación
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 min-w-[130px]">
                  Equipo / Squad
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 min-w-[110px]">
                  Estado
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 min-w-[180px]">
                  Score & Clasificación
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 min-w-[120px] hidden lg:table-cell">
                  Fecha Registro
                </TableHead>
                {/* Sticky Right Actions Column Header */}
                <TableHead className="font-semibold text-xs py-3.5 pr-4 text-right min-w-[150px] sticky right-0 bg-muted/95 backdrop-blur-xs z-20 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)]">
                  Acciones
                </TableHead>
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
              ) : paginatedData.length === 0 ? (
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
                            Todos los Estados ({data.length})
                          </button>{' '}
                          para ver los candidatos completados o crear uno nuevo arriba.
                        </span>
                      ) : (
                        'Intenta ajustar los criterios de búsqueda o restablecer filtros.'
                      )}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((candidate) => {
                  const isCompleted = candidate.evaluationStatus === 'completed' || candidate.processStatus === 'completed'
                  const isClosed = candidate.processStatus === 'archived' || candidate.processStatus === 'closed'
                  const finalScore = candidate.finalScore

                  return (
                    <TableRow
                      key={candidate.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Candidato info */}
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {candidate.fullName ? candidate.fullName.charAt(0) : candidate.email.charAt(0)}
                          </div>
                          <div className="space-y-0.5 max-w-[200px] sm:max-w-[260px] truncate">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm text-foreground truncate">
                                {candidate.fullName || 'Candidato Sin Nombre'}
                              </div>
                              {candidate.trackId === 'otel_expert' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  ⚡ OTel
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                              <span className="truncate">{candidate.email}</span>
                              {candidate.nationalId && (
                                <>
                                  <span className="text-muted-foreground/40 shrink-0">•</span>
                                  <span className="font-mono text-[11px] shrink-0 text-muted-foreground/80">
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
                        <span className="text-xs font-medium text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md border inline-block max-w-[140px] truncate">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {finalScore !== null && finalScore !== undefined ? (
                            <span className="font-mono font-bold text-xs sm:text-sm text-foreground shrink-0">
                              {finalScore.toFixed(1)} / 100
                            </span>
                          ) : null}
                          <ScoreClassificationBadge
                            classification={candidate.classification}
                            score={finalScore}
                          />
                        </div>
                      </TableCell>

                      {/* Fecha de Creación */}
                      <TableCell className="py-3 text-xs text-muted-foreground hidden lg:table-cell">
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

                      {/* Sticky Right Actions Column Cell */}
                      <TableCell className="py-3 pr-4 text-right sticky right-0 bg-card group-hover:bg-muted/30 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón de acción primaria contextual */}
                          {isCompleted ? (
                            <Link href={`/evaluator/report/${candidate.evaluationId || candidate.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <FileText className="size-3.5" />
                                <span>Ver Reporte</span>
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/evaluator/evaluate/${candidate.id}`}>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
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
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  aria-label="Más acciones"
                                />
                              }
                            >
                              <MoreVertical className="size-3.5" />
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
                                onClick={() =>
                                  router.push(`/evaluator/report/${candidate.evaluationId || candidate.id}`)
                                }
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

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Gestión de Cuenta</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  setUserToChangePassword({
                                    id: candidate.id,
                                    email: candidate.email,
                                    fullName: candidate.fullName,
                                    role: 'candidate',
                                  })
                                }
                                className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600"
                              >
                                <KeyRound className="size-4" />
                                <span>Cambiar Contraseña</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  setUserToEdit({
                                    id: candidate.id,
                                    email: candidate.email,
                                    fullName: candidate.fullName,
                                    role: 'candidate',
                                    nationalIdType: candidate.nationalIdType,
                                    nationalId: candidate.nationalId,
                                    team: candidate.team,
                                  })
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <UserCog className="size-4" />
                                <span>Editar Candidato</span>
                              </DropdownMenuItem>
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

        {/* Table Footer with Pagination Controls */}
        <div className="px-4 py-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          {/* Summary count */}
          <div className="flex items-center gap-2">
            <span>
              Mostrando{' '}
              <strong className="text-foreground">
                {filteredData.length > 0
                  ? `${(currentPage - 1) * pageSize + 1} - ${Math.min(
                      currentPage * pageSize,
                      filteredData.length
                    )}`
                  : 0}
              </strong>{' '}
              de <strong className="text-foreground">{filteredData.length}</strong> candidatos
              {data.length !== filteredData.length && ` (de ${data.length} totales)`}
            </span>
          </div>

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Page size selector */}
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-muted-foreground">Filas:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-7 text-xs bg-background border rounded-md px-1.5 py-0.5 text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={9999}>Todos</option>
                </select>
              </div>

              {/* Prev / Next Page Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <span className="px-2 font-medium text-foreground">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
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

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        user={userToChangePassword}
        open={Boolean(userToChangePassword)}
        onOpenChange={(open) => !open && setUserToChangePassword(null)}
        onSuccess={() => {
          router.refresh()
          onDataChange?.()
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={userToEdit}
        open={Boolean(userToEdit)}
        onOpenChange={(open) => !open && setUserToEdit(null)}
        teams={availableTeams}
        onSuccess={() => {
          router.refresh()
          onDataChange?.()
        }}
      />
    </div>
  )
}

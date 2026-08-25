'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
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
import { EvaluatorUser, deleteUser } from '@/app/actions/admin'
import { ChangePasswordDialog, PasswordTargetUser } from '@/components/evaluator/ChangePasswordDialog'
import { EditUserDialog, EditableUser } from '@/components/evaluator/EditUserDialog'
import { ExportMenu, ExportRow } from '@/components/evaluator/ExportMenu'
import { CopyButton } from '@/components/evaluator/CopyButton'
import {
  Search,
  MoreVertical,
  KeyRound,
  UserCog,
  Trash2,
  Shield,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
} from 'lucide-react'

interface EvaluatorsDataTableProps {
  data: EvaluatorUser[]
  loading?: boolean
  onDataChange?: () => void
}

export function EvaluatorsDataTable({
  data,
  loading = false,
  onDataChange,
}: EvaluatorsDataTableProps) {
  const router = useRouter()

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Dialogs State
  const [userToChangePassword, setUserToChangePassword] = useState<PasswordTargetUser | null>(null)
  const [userToEdit, setUserToEdit] = useState<EditableUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const query = debouncedSearch.toLowerCase().trim()
      if (!query) return true

      const textToSearch = `${row.full_name || ''} ${row.email || ''} ${row.national_id || ''}`.toLowerCase()
      return textToSearch.includes(query)
    })
  }, [data, debouncedSearch])

  // Pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Prepare export dataset
  const exportDataset: ExportRow[] = useMemo(() => {
    return filteredData.map((ev) => ({
      fullName: ev.full_name || 'Sin nombre',
      email: ev.email,
      nationalId: ev.national_id ? `${ev.national_id_type || 'CC'} ${ev.national_id}` : 'No registrado',
      team: 'Equipo Evaluador / Admin',
      status: 'Activo',
      finalScore: null,
      classification: 'Evaluador',
      createdAt: ev.created_at,
    }))
  }, [filteredData])

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await deleteUser(userToDelete.id)
      if (res.success) {
        setUserToDelete(null)
        router.refresh()
        onDataChange?.()
      } else {
        setDeleteError(res.error || 'Error al eliminar el evaluador.')
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error inesperado del servidor.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-2xs">
        {/* Search input with debounced filtering */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo institucional o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 h-9 text-xs bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Toolbar Right: Export dataset */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <ExportMenu
            data={exportDataset}
            filename={`evaluadores_seti_${new Date().toISOString().split('T')[0]}`}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] font-semibold text-xs text-foreground">
                  Evaluador / Nombre
                </TableHead>
                <TableHead className="font-semibold text-xs text-foreground">
                  Correo Electrónico Institucional
                </TableHead>
                <TableHead className="font-semibold text-xs text-foreground">
                  Identificación
                </TableHead>
                <TableHead className="font-semibold text-xs text-foreground">
                  Fecha de Registro
                </TableHead>
                <TableHead className="text-center font-semibold text-xs text-foreground">
                  Rol del Sistema
                </TableHead>
                <TableHead className="sticky right-0 z-20 w-[90px] text-right font-semibold text-xs text-foreground bg-muted/80 shadow-[-8px_0_12px_-6px_rgba(0,0,0,0.08)]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span>Cargando evaluadores...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Shield className="size-8 text-muted-foreground/40 stroke-1" />
                      <p className="font-medium text-foreground">No se encontraron evaluadores</p>
                      <p className="text-[11px]">
                        {debouncedSearch
                          ? 'No hay registros que coincidan con tu búsqueda.'
                          : 'No hay usuarios evaluadores registrados en el sistema.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((evaluator) => {
                  return (
                    <TableRow key={evaluator.id} className="group hover:bg-muted/30 transition-colors">
                      {/* Nombre y Avatar */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                            {evaluator.full_name
                              ? evaluator.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()
                              : 'EV'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {evaluator.full_name || 'Evaluador sin nombre'}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Shield className="size-2.5 text-primary" />
                              Acceso Administrativo
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Correo con CopyButton */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate max-w-[200px] font-mono text-[11px]">
                            {evaluator.email || 'Sin correo asociado'}
                          </span>
                          {evaluator.email && <CopyButton text={evaluator.email} />}
                        </div>
                      </TableCell>

                      {/* Documento de Identidad */}
                      <TableCell>
                        {evaluator.national_id ? (
                          <div className="flex items-center gap-1 text-xs text-foreground font-mono">
                            <Fingerprint className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground text-[10px]">
                              {evaluator.national_id_type || 'CC'}
                            </span>
                            <span>{evaluator.national_id}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No registrado</span>
                        )}
                      </TableCell>

                      {/* Fecha de Registro */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{formatDate(evaluator.created_at)}</span>
                        </div>
                      </TableCell>

                      {/* Rol */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium"
                        >
                          Evaluador / Admin
                        </Badge>
                      </TableCell>

                      {/* Acciones Sticky */}
                      <TableCell className="sticky right-0 z-10 text-right bg-card group-hover:bg-muted/30 shadow-[-8px_0_12px_-6px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-end">
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
                            <DropdownMenuContent className="w-52">
                              <DropdownMenuLabel>Acciones de Cuenta</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() =>
                                  setUserToChangePassword({
                                    id: evaluator.id,
                                    email: evaluator.email,
                                    fullName: evaluator.full_name || 'Evaluador',
                                    role: 'evaluator',
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
                                    id: evaluator.id,
                                    email: evaluator.email,
                                    fullName: evaluator.full_name || '',
                                    role: 'evaluator',
                                    nationalIdType: evaluator.national_id_type,
                                    nationalId: evaluator.national_id,
                                  })
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <UserCog className="size-4" />
                                <span>Editar Perfil</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setUserToDelete({
                                    id: evaluator.id,
                                    name: evaluator.full_name || 'Evaluador',
                                    email: evaluator.email,
                                  })
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                                <span>Eliminar Evaluador</span>
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
              de <strong className="text-foreground">{filteredData.length}</strong> evaluadores
              {data.length !== filteredData.length && ` (de ${data.length} totales)`}
            </span>
          </div>

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
        onSuccess={() => {
          router.refresh()
          onDataChange?.()
        }}
      />

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>¿Eliminar cuenta de evaluador?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Estás a punto de revocar y eliminar permanentemente el acceso de{' '}
              <strong>{userToDelete?.name}</strong> ({userToDelete?.email}).
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Esta acción eliminará sus credenciales de acceso y su perfil de evaluador en el
                sistema.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirmar y Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

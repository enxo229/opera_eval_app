'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listUsers, createUser, deleteUser, updateUser, UserWithProfile, getSelectionProcessHistory, SelectionProcessWithStatus, reopenEvaluation, closeSelectionProcess } from '@/app/actions/admin'
import { UserPlus, Trash2, Loader2, Users, Shield, User, GraduationCap, RefreshCw, History, AlertTriangle, Pencil, Info, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

export default function AdminPage() {
    const [users, setUsers] = useState<UserWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'candidate' | 'evaluator'>('candidate')
    const [nationalIdType, setNationalIdType] = useState('CC')
    const [nationalId, setNationalId] = useState('')
    const [team, setTeam] = useState('')
    const [observations, setObservations] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)
    const [formWarning, setFormWarning] = useState<string | null>(null)

    // History Modal State
    const [historyEmail, setHistoryEmail] = useState<string | null>(null)
    const [historyData, setHistoryData] = useState<SelectionProcessWithStatus[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null)
    const [editFullName, setEditFullName] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [editNationalIdType, setEditNationalIdType] = useState('')
    const [editNationalId, setEditNationalId] = useState('')
    const [editTeam, setEditTeam] = useState('')
    const [editObservations, setEditObservations] = useState('')
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)
    
    // Close Process State
    const [closingProcessId, setClosingProcessId] = useState<string | null>(null)
    
    const [reopening, setReopening] = useState(false)
    const [reopenStatus, setReopenStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

    const loadUsers = useCallback(async () => {
        try {
            const data = await listUsers()
            setUsers(data)
        } catch (e: any) {
            console.error('Error loading users:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    const handleCreate = async (e: React.FormEvent, confirmPreviousProcesses = false) => {
        e.preventDefault()
        setFormError(null)
        setFormSuccess(null)
        setFormWarning(null)
        setCreating(true)

        try {
            const result = await createUser(email, password, fullName, role, nationalIdType, nationalId, team, observations, confirmPreviousProcesses)

            if (result.success) {
                setFormSuccess(`✅ Usuario ${email} creado como ${role}. Proceso activo iniciado.`)
                setEmail('')
                setPassword('')
                setFullName('')
                setNationalId('')
                setTeam('')
                setObservations('')
                await loadUsers()
            } else if (result.warning) {
                setFormWarning(result.warning)
            } else {
                setFormError(result.error || 'Error desconocido')
            }
        } catch (err: any) {
            console.error('Error in handleCreate:', err)
            setFormError(`Error inesperado: ${err.message}`)
        } finally {
            setCreating(false)
        }
    }

    const handleViewHistory = async (email: string) => {
        setHistoryEmail(email)
        setLoadingHistory(true)
        const data = await getSelectionProcessHistory(email)
        setHistoryData(data)
        setLoadingHistory(false)
    }

    const handleDelete = async (userId: string, userEmail: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${userEmail}? Esta acción no se puede deshacer.`)) return
        setDeletingId(userId)
        const result = await deleteUser(userId)
        if (result.success) {
            await loadUsers()
        } else {
            alert(`Error: ${result.error}`)
        }
        setDeletingId(null)
    }

    const handleEditOpen = async (user: UserWithProfile) => {
        setEditingUser(user)
        setEditFullName(user.full_name || '')
        setEditPassword('')
        setEditNationalIdType(user.national_id_type || 'CC (Cédula de Ciudadanía)')
        setEditNationalId(user.national_id || '')
        setEditError(null)
        
        // If candidate, try to fetch the active team/observations from history
        if (user.role === 'candidate') {
            const history = await getSelectionProcessHistory(user.email)
            const active = history.find(h => h.status === 'active')
            if (active) {
                setEditTeam(active.team || '')
                setEditObservations(active.observations || '')
            } else {
                setEditTeam('')
                setEditObservations('')
            }
        }
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return
        setEditError(null)
        setSavingEdit(true)

        try {
            const result = await updateUser(
                editingUser.id,
                editFullName,
                editNationalIdType,
                editNationalId,
                editPassword || undefined,
                editingUser.role === 'candidate' ? editTeam : undefined,
                editingUser.role === 'candidate' ? editObservations : undefined
            )

            if (result.success) {
                setEditingUser(null)
                await loadUsers()
            } else {
                setEditError(result.error || 'Error al actualizar')
            }
        } catch (err: any) {
            console.error('Error in handleSaveEdit:', err)
            setEditError(`Error inesperado: ${err.message}`)
        } finally {
            setSavingEdit(false)
        }
    }

    const handleCloseProcessInHistory = async (processId: string) => {
        if (!confirm('¿Estás seguro de que deseas cerrar y finalizar este proceso de selección manualmente?')) return
        
        setClosingProcessId(processId)
        try {
            const res = await closeSelectionProcess(processId)
            if (res.success && historyEmail) {
                const data = await getSelectionProcessHistory(historyEmail)
                setHistoryData(data)
                // Opcional: mostrar un success en algún lado
            } else {
                alert(res.error || 'Error al cerrar proceso.')
            }
        } catch (e: any) {
            alert(`Error inesperado: ${e.message}`)
        } finally {
            setClosingProcessId(null)
        }
    }

    const handleReopenInHistory = async (evaluationId: string) => {
        if (!confirm(`¿Estás seguro de reabrir esta evaluación? El evaluador podrá editarla de nuevo y se invalidará el reporte ejecutivo actual.`)) return
        
        setReopening(true)
        try {
            const result = await reopenEvaluation(evaluationId)
            if (result.success) {
                alert('✅ Evaluación reabierta exitosamente. El evaluador ya puede modificarla.')
                if (historyEmail) handleViewHistory(historyEmail)
                await loadUsers()
            } else {
                alert(`❌ Error: ${result.error}`)
            }
        } catch (err: any) {
            alert(`❌ Error inesperado: ${err.message}`)
        } finally {
            setReopening(false)
        }
    }

    const candidates = users.filter(u => u.role === 'candidate')
    const evaluators = users.filter(u => u.role === 'evaluator')
    const others = users.filter(u => !u.role)

    const EDUCATION_LABELS: Record<string, string> = {
        bachiller: 'Bachiller',
        tecnico_sena: 'Técnico SENA',
        tecnologo: 'Tecnólogo',
        profesional: 'Profesional',
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-primary drop-shadow-sm">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestiona candidatos y evaluadores de la plataforma OTP.</p>
            </div>

            {/* Create User Form */}
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <UserPlus className="h-5 w-5" /> Crear Nuevo Usuario
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Email</label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="usuario@seti.com.co" className="bg-background border-input"
                                    autoComplete="off" data-1p-ignore />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Contraseña</label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                    placeholder="Mínimo 6 caracteres" minLength={6} className="bg-background border-input"
                                    autoComplete="new-password" data-1p-ignore />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Nombre Completo</label>
                                <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                                    placeholder="Nombre y Apellido" className="bg-background border-input" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Rol</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setRole('candidate')}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${role === 'candidate' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'}`}>
                                        <User className="h-4 w-4" /> Candidato
                                    </button>
                                    <button type="button" onClick={() => setRole('evaluator')}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${role === 'evaluator' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'}`}>
                                        <Shield className="h-4 w-4" /> Evaluador
                                    </button>
                                </div>
                            </div>
                            
                            {role === 'candidate' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Tipo de Identificación *</label>
                                        <select value={nationalIdType} onChange={e => setNationalIdType(e.target.value)} required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                                            <option value="CC">Cédula de Ciudadanía (CC)</option>
                                            <option value="CE">Cédula de Extranjería (CE)</option>
                                            <option value="TI">Tarjeta de Identidad (TI)</option>
                                            <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                                            <option value="PEP">Permiso Especial de Permanencia (PEP)</option>
                                            <option value="Pasaporte">Pasaporte (PA)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Número de Identificación *</label>
                                        <Input type="text" value={nationalId} onChange={e => setNationalId(e.target.value)} required
                                            placeholder="1014..." className="bg-background border-input" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Equipo (Opcional)</label>
                                        <Input type="text" value={team} onChange={e => setTeam(e.target.value)}
                                            placeholder="ej. Squad Alpha, SRE" className="bg-background border-input" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground">Observaciones del Proceso</label>
                                        <Input type="text" value={observations} onChange={e => setObservations(e.target.value)}
                                            placeholder="Notas para el evaluador" className="bg-background border-input" />
                                    </div>
                                </>
                            )}
                        </div>

                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex gap-2 items-center"><AlertTriangle className="h-4 w-4" /> {formError}</div>
                        )}
                        {formSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">{formSuccess}</div>
                        )}
                        {formWarning && (
                            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg space-y-3">
                                <div className="flex gap-2 items-center"><AlertTriangle className="h-4 w-4" /> {formWarning}</div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFormWarning(null)}>Cancelar</Button>
                                    <Button type="button" size="sm" onClick={(e) => handleCreate(e, true)} className="bg-amber-600 hover:bg-amber-700 text-white">Sí, crear nuevo proceso</Button>
                                </div>
                            </div>
                        )}

                        {!formWarning && (
                            <Button type="submit" disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11">
                                {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : <><UserPlus className="h-4 w-4 mr-2" /> Crear Usuario y Proceso</>}
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="text-lg flex items-center justify-between text-primary">
                        <span className="flex items-center gap-2"><Users className="h-5 w-5" /> Usuarios Registrados</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadUsers() }}
                                disabled={loading} className="h-8 px-3 text-xs">
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                Recargar
                            </Button>
                            <span className="text-sm font-mono text-muted-foreground">{users.length} total</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="font-bold">Nombre</TableHead>
                                    <TableHead className="font-bold">Email</TableHead>
                                    <TableHead className="font-bold">Identificación</TableHead>
                                    <TableHead className="font-bold">Rol</TableHead>
                                    <TableHead className="font-bold">Escolaridad</TableHead>
                                    <TableHead className="font-bold">Creado</TableHead>
                                    <TableHead className="font-bold text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No hay usuarios registrados
                                        </TableCell>
                                    </TableRow>
                                )}
                                {users.map(user => (
                                    <TableRow key={user.id} className="hover:bg-muted/20">
                                        <TableCell className="font-medium text-foreground">
                                            {user.full_name || <span className="text-muted-foreground italic">Sin nombre</span>}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {user.national_id ? <span title={user.national_id_type || ''}>{user.national_id}</span> : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {user.role === 'evaluator' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                                    <Shield className="h-3 w-3" /> Evaluador
                                                </span>
                                            ) : user.role === 'candidate' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                                    <User className="h-3 w-3" /> Candidato
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Sin rol</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.education_level ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <GraduationCap className="h-3 w-3" /> {EDUCATION_LABELS[user.education_level] || user.education_level}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString('es-CO')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditOpen(user)} className="text-primary hover:text-primary/80 hover:bg-primary/5 h-8 px-2" title="Editar Usuario">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {user.role === 'candidate' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewHistory(user.email)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 px-2" title="Ver Historial de Procesos">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm"
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    disabled={deletingId === user.id}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2" title="Eliminar Perfil (No borra el historial)">
                                                    {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* History Modal */}
            <Dialog open={!!historyEmail} onOpenChange={(open) => !open && setHistoryEmail(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Historial de Procesos: {historyEmail}</DialogTitle>
                    </DialogHeader>
                    {loadingHistory ? (
                        <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : historyData.length === 0 ? (
                        <p className="text-muted-foreground text-center p-8">No se encontraron procesos de selección históricos para este correo.</p>
                    ) : (
                        <div className="overflow-y-auto pr-2 flex-1 min-h-[50vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha Creación</TableHead>
                                        <TableHead>Identificación</TableHead>
                                        <TableHead>Equipo</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyData.map(proc => (
                                        <TableRow key={proc.id}>
                                            <TableCell className="whitespace-nowrap">{new Date(proc.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{proc.candidate_national_id || '-'}</TableCell>
                                            <TableCell>{proc.team || '-'}</TableCell>
                                            <TableCell className="max-w-xs truncate" title={proc.observations || ''}>{proc.observations || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {proc.status === 'active' ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-default w-fit">Proceso Activo</Badge>
                                                    ) : proc.status === 'completed' ? (
                                                        <Badge variant="secondary" className="cursor-default w-fit">Proceso Finalizado</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="cursor-default text-muted-foreground w-fit">Archivado</Badge>
                                                    )}
                                                    {proc.evaluation_status === 'completed' && (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] w-fit">
                                                            Evaluación Cerrada
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {proc.evaluation_status === 'completed' && proc.evaluation_id && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        disabled={reopening}
                                                        onClick={() => handleReopenInHistory(proc.evaluation_id!)}
                                                        className="h-8 text-[10px] font-bold border-amber-200 text-amber-700 hover:bg-amber-50"
                                                    >
                                                        {reopening ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                                        REABRIR
                                                    </Button>
                                                )}
                                                {proc.status === 'active' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        disabled={closingProcessId === proc.id}
                                                        onClick={() => handleCloseProcessInHistory(proc.id)}
                                                        className="h-8 text-[10px] font-bold border-red-200 text-red-700 hover:bg-red-50"
                                                        title="Cerrar proceso y marcar como finalizado"
                                                    >
                                                        {closingProcessId === proc.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                        CERRAR
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" /> Editar Usuario: {editingUser?.email}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Email (No editable)</label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="relative w-full text-left outline-none block">
                                            <Input value={editingUser?.email || ''} disabled className="bg-muted opacity-80 cursor-not-allowed pr-10" />
                                            <Info className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                                            Si requiere cambiar el correo se recomienda eliminar el registro y crearlo de nuevo.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Rol (No editable)</label>
                                <Input value={editingUser?.role === 'candidate' ? 'Candidato' : 'Evaluador'} disabled className="bg-muted opacity-80 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Nombre Completo</label>
                                <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Nueva Contraseña (Opcional)</label>
                                <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" minLength={6} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Tipo ID</label>
                                <select value={editNationalIdType} onChange={e => setEditNationalIdType(e.target.value)} required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                                    <option value="CE">Cédula de Extranjería (CE)</option>
                                    <option value="TI">Tarjeta de Identidad (TI)</option>
                                    <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                                    <option value="PEP">Permiso Especial de Permanencia (PEP)</option>
                                    <option value="Pasaporte">Pasaporte (PA)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Número ID</label>
                                <Input value={editNationalId} onChange={e => setEditNationalId(e.target.value)} required />
                            </div>
                            
                            {editingUser?.role === 'candidate' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Equipo</label>
                                        <Input value={editTeam} onChange={e => setEditTeam(e.target.value)} placeholder="Nombre del equipo" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Observaciones</label>
                                        <Input value={editObservations} onChange={e => setEditObservations(e.target.value)} placeholder="Notas internas" />
                                    </div>
                                </>
                            )}
                        </div>

                        {editError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex gap-2 items-center">
                                <AlertTriangle className="h-4 w-4" /> {editError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                            <Button type="submit" disabled={savingEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]">
                                {savingEdit ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Summary by role */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-800">{candidates.length}</p>
                    <p className="text-xs text-blue-600 font-medium">Candidatos</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-800">{evaluators.length}</p>
                    <p className="text-xs text-amber-600 font-medium">Evaluadores</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{others.length}</p>
                    <p className="text-xs text-slate-600 font-medium">Sin rol</p>
                </div>
            </div>
        </div>
    )
}

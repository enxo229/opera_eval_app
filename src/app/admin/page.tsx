'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listUsers, createUser, deleteUser, UserWithProfile } from '@/app/actions/admin'
import { UserPlus, Trash2, Loader2, Users, Shield, User, GraduationCap, RefreshCw } from 'lucide-react'

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
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setFormSuccess(null)
        setCreating(true)

        const result = await createUser(email, password, fullName, role)

        if (result.success) {
            setFormSuccess(`✅ Usuario ${email} creado como ${role}`)
            setEmail('')
            setPassword('')
            setFullName('')
            await loadUsers()
        } else {
            setFormError(result.error || 'Error desconocido')
        }
        setCreating(false)
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
                                    placeholder="usuario@seti.com.co" className="bg-background border-input" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Contraseña</label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                    placeholder="Mínimo 6 caracteres" minLength={6} className="bg-background border-input" />
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
                        </div>

                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">❌ {formError}</div>
                        )}
                        {formSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">{formSuccess}</div>
                        )}

                        <Button type="submit" disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11">
                            {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : <><UserPlus className="h-4 w-4 mr-2" /> Crear Usuario</>}
                        </Button>
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
                                            <Button variant="ghost" size="sm"
                                                onClick={() => handleDelete(user.id, user.email)}
                                                disabled={deletingId === user.id}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                                                {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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

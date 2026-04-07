'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { searchHistoricalProcesses } from '@/app/actions/admin'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, History, ArrowLeft, Loader2, PlayCircle, Archive, CheckCircle2 } from 'lucide-react'

type HistoricalProcess = {
    id: string
    candidate_email: string
    candidate_national_id: string | null
    team: string | null
    observations: string | null
    status: string
    created_at: string
    evaluations: {
        id: string
        status: string
        final_score: number | null
        classification: string | null
    }[]
}

function getClassBadge(classification?: string | null) {
    if (!classification) return <Badge variant="outline" className="text-gray-400">Sin clasificar</Badge>
    if (classification.includes('Listo')) return <Badge className="bg-[#10B981] text-white cursor-default">{classification}</Badge>
    if (classification.includes('nivelación')) return <Badge className="bg-[#F59E0B] text-white cursor-default">{classification}</Badge>
    if (classification.includes('preparación')) return <Badge className="bg-[#F97316] text-white cursor-default">{classification}</Badge>
    return <Badge className="bg-[#EF4444] text-white cursor-default">{classification}</Badge>
}

export default function HistorySearchPage() {
    const [searchTermCC, setSearchTermCC] = useState('')
    const [searchTermEmail, setSearchTermEmail] = useState('')
    const [searchTermTeam, setSearchTermTeam] = useState('')
    
    const [loading, setLoading] = useState(false)
    const [processes, setProcesses] = useState<HistoricalProcess[]>([])
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setLoading(true)
        setSearched(true)
        
        try {
            const data = await searchHistoricalProcesses(searchTermCC, searchTermEmail, searchTermTeam)
            setProcesses(data as any || [])
        } catch (err) {
            console.error('Error fetching historical processes:', err)
        } finally {
            setLoading(false)
        }
    }

    // Carga inicial (Vacío o mostrar recientes)
    useEffect(() => {
        handleSearch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <CompanyLogo width={100} height={35} />
                    <div className="h-10 w-px bg-border shadow-sm" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm flex items-center gap-3">
                            <History className="h-7 w-7 text-primary/80" /> Búsqueda Histórica
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Explora y filtra procesos de selección previos y activos globalmente.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/evaluator">
                        <Button variant="outline" className="border-border text-muted-foreground hover:text-primary hover:border-primary">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Identificación</label>
                        <Input 
                            value={searchTermCC} 
                            onChange={(e) => setSearchTermCC(e.target.value)} 
                            placeholder="Ej. 1014..." 
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Correo Electrónico</label>
                        <Input 
                            value={searchTermEmail} 
                            onChange={(e) => setSearchTermEmail(e.target.value)} 
                            placeholder="Ej. usuario@seti.com.co" 
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Equipo</label>
                        <Input 
                            value={searchTermTeam} 
                            onChange={(e) => setSearchTermTeam(e.target.value)} 
                            placeholder="Ej. Squad Alpha" 
                            className="bg-background"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Buscar Procesos
                    </Button>
                </form>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border bg-muted/30">
                            <TableHead className="font-bold">Fecha Proceso</TableHead>
                            <TableHead className="font-bold">Candidato / Identificación</TableHead>
                            <TableHead className="font-bold">Status del Proceso</TableHead>
                            <TableHead className="font-bold">Equipo y Obs.</TableHead>
                            <TableHead className="font-bold">Evaluación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && searched && processes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    No se hallaron procesos que coincidan con los filtros brindados.
                                </TableCell>
                            </TableRow>
                        )}
                        {loading && processes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        )}
                        {processes.map((proc) => {
                            const evalData = proc.evaluations && proc.evaluations.length > 0 ? proc.evaluations[0] : null
                            
                            return (
                                <TableRow key={proc.id} className="border-border hover:bg-muted/30">
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {new Date(proc.created_at).toLocaleDateString('es-CO')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{proc.candidate_email}</div>
                                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                                            ID: {proc.candidate_national_id || 'N/A'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {proc.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                                                <PlayCircle className="h-4 w-4" /> Activo
                                            </span>
                                        ) : proc.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm">
                                                <CheckCircle2 className="h-4 w-4" /> Completado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold text-sm">
                                                <Archive className="h-4 w-4" /> Archivado
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{proc.team || 'Sin equipo asignado'}</div>
                                        <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={proc.observations || ''}>
                                            {proc.observations || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {evalData ? (
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {evalData.final_score !== null ? (
                                                    <span className="font-mono font-bold text-sm" style={{ color: evalData.final_score >= 80 ? '#10B981' : evalData.final_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                                                        Score: {evalData.final_score}/100
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Score Pdto.</span>
                                                )}
                                                {getClassBadge(evalData.classification)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Sin Evaluación Vinculada</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

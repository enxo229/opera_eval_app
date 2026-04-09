'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { searchHistoricalProcesses, reopenEvaluation } from '@/app/actions/admin'
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
import { Search, History, ArrowLeft, Loader2, PlayCircle, Archive, CheckCircle2, Shield, FileText, RefreshCw } from 'lucide-react'

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
        candidate_id: string
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
    const [reopening, setReopening] = useState(false)
    const router = useRouter()

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

    const handleReopen = async (evaluationId: string) => {
        if (!confirm('¿Estás seguro de reabrir esta evaluación? El evaluador podrá editarla y el reporte actual se invalidará.')) return
        
        setReopening(true)
        try {
            const result = await reopenEvaluation(evaluationId)
            if (result.success) {
                alert('✅ Evaluación reabierta exitosamente.')
                handleSearch() // Refresh results
            } else {
                alert(`❌ Error: ${result.error}`)
            }
        } catch (err: any) {
            alert(`❌ Error inesperado: ${err.message}`)
        } finally {
            setReopening(false)
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
                        <p className="text-muted-foreground mt-1 text-lg">
                            Explora y filtra procesos de selección previos y activos globalmente.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin">
                        <Button variant="outline" className="border-border text-muted-foreground hover:text-primary hover:border-primary">
                            <Shield className="h-4 w-4 mr-2" /> Panel de Admin
                        </Button>
                    </Link>
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
                        <TableRow className="border-border bg-muted/50">
                            <TableHead className="font-bold text-foreground">Fecha Proceso</TableHead>
                            <TableHead className="font-bold text-foreground">Candidato / Identificación</TableHead>
                            <TableHead className="font-bold text-foreground">Status Proceso</TableHead>
                            <TableHead className="font-bold text-foreground">Score Final</TableHead>
                            <TableHead className="font-bold text-foreground">Clasificación</TableHead>
                            <TableHead className="text-right font-bold text-foreground pr-8">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && searched && processes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    No se hallaron procesos que coincidan con los filtros brindados.
                                </TableCell>
                            </TableRow>
                        )}
                        {loading && processes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        )}
                        {processes.map((proc) => {
                            const evalData = proc.evaluations && proc.evaluations.length > 0 ? proc.evaluations[0] : null
                            const hasCandidateId = !!evalData?.candidate_id

                            return (
                                <TableRow 
                                    key={proc.id} 
                                    className="border-border hover:bg-muted/30 transition-colors"
                                >
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {new Date(proc.created_at).toLocaleDateString('es-CO')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{proc.candidate_email}</div>
                                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                                            ID: {proc.candidate_national_id || 'N/A'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {proc.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                                <PlayCircle className="h-3 w-3" /> Activo
                                            </span>
                                        ) : proc.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                                <CheckCircle2 className="h-3 w-3" /> Completado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                <Archive className="h-3 w-3" /> Archivado
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {evalData?.final_score !== null && evalData?.final_score !== undefined ? (
                                            <span className="font-mono text-lg font-black" style={{ color: evalData.final_score >= 80 ? '#10B981' : evalData.final_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                                                {evalData.final_score}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getClassBadge(evalData?.classification)}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            {hasCandidateId ? (
                                                <Link href={`/evaluator/evaluate/${evalData.candidate_id}`}>
                                                    <Button size="sm" variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold transition-all shadow-sm gap-2">
                                                        <FileText className="h-3.5 w-3.5" /> Ver Resultado
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Sin evaluación</span>
                                            )}
                                            {evalData?.status === 'completed' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    disabled={reopening}
                                                    onClick={() => handleReopen(evalData.id)}
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold gap-2"
                                                >
                                                    {reopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                                    Reabrir
                                                </Button>
                                            )}
                                        </div>
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

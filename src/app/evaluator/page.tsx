import Link from 'next/link'
import { CompanyLogo } from '@/components/CompanyLogo'
import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function getClassBadge(classification?: string | null) {
    if (!classification) return <Badge variant="outline" className="text-gray-400">Sin clasificar</Badge>

    if (classification.includes('Listo'))
        return <Badge className="bg-[#10B981] text-white">{classification}</Badge>
    if (classification.includes('nivelación'))
        return <Badge className="bg-[#F59E0B] text-white">{classification}</Badge>
    if (classification.includes('preparación'))
        return <Badge className="bg-[#F97316] text-white">{classification}</Badge>

    return <Badge className="bg-[#EF4444] text-white">{classification}</Badge>
}

export default async function EvaluatorDashboard() {
    const supabase = await createClient()

    // Buscamos todos los perfiles que son 'candidate'
    const { data: candidates, error } = await supabase
        .from('profiles')
        .select(`
      id, 
      full_name, 
      role,
      evaluations!evaluations_candidate_id_fkey (
        id,
        status,
        final_score,
        classification
      )
    `)
        .eq('role', 'candidate')

    if (error) {
        console.error('Error fetching candidates:', error)
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <CompanyLogo width={100} height={35} />
                    <div className="h-10 w-px bg-border shadow-sm" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm">Dashboard de Evaluador</h1>
                        <p className="text-muted-foreground mt-2">
                            Supervisa y evalúa a los candidatos del programa O11y SkillFlow.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin">
                        <Button variant="outline" className="border-border text-muted-foreground hover:text-primary hover:border-primary">
                            ⚙️ Admin
                        </Button>
                    </Link>
                    <form action="/auth/signout" method="post">
                        <Button variant="outline" type="submit" className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10">
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-foreground">Candidato</TableHead>
                            <TableHead className="text-foreground">Rol Actual</TableHead>
                            <TableHead className="text-foreground">Estado</TableHead>
                            <TableHead className="text-foreground">Score Final</TableHead>
                            <TableHead className="text-foreground">Clasificación</TableHead>
                            <TableHead className="text-right text-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No hay candidatos registrados en la plataforma.
                                </TableCell>
                            </TableRow>
                        )}
                        {candidates?.map((c: any) => {
                            // Cast evaluations explicitly
                            const evaluations = c.evaluations as any[]
                            const evalData = evaluations && evaluations.length > 0 ? evaluations[0] : null
                            const status = evalData?.status === 'completed' ? 'Completado' : evalData?.status === 'draft' ? 'En progreso' : 'No iniciada'

                            return (
                                <TableRow key={c.id} className="border-border hover:bg-muted/50">
                                    <TableCell className="font-medium text-foreground">{c.full_name || 'Candidato Sin Nombre'}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.role}</TableCell>
                                    <TableCell>
                                        {status === 'Completado' ? (
                                            <span className="text-emerald-600 font-semibold">Completado</span>
                                        ) : (
                                            <span className="text-amber-500 font-semibold">{status}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-lg font-semibold" style={{ color: evalData?.final_score >= 80 ? '#10B981' : evalData?.final_score >= 60 ? '#F59E0B' : evalData?.final_score >= 40 ? '#F97316' : evalData?.final_score != null ? '#EF4444' : undefined }}>
                                        {evalData?.final_score !== null && evalData?.final_score !== undefined ? evalData.final_score : '-'}
                                    </TableCell>
                                    <TableCell>{getClassBadge(evalData?.classification)}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/evaluator/evaluate/${c.id}`}>
                                            <Button variant={status === 'Completado' ? 'secondary' : 'default'} size="sm" className={status === 'Completado' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary hover:bg-primary/90 text-primary-foreground drop-shadow-sm'}>
                                                {status === 'Completado' ? 'Ver Resultado' : 'Evaluar'}
                                            </Button>
                                        </Link>
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

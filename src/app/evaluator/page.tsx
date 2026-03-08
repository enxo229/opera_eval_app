import Link from 'next/link'
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
      evaluations (
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
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#00A3FF]">Dashboard de Evaluador</h1>
                    <p className="text-muted-foreground mt-2">
                        Supervisa y evalúa a los candidatos del programa Observability Talent Pivot.
                    </p>
                </div>
                <form action="/auth/signout" method="post">
                    <Button variant="outline" type="submit" className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10">
                        Cerrar Sesión
                    </Button>
                </form>
            </div>

            <div className="rounded-md border border-[#1F2937] bg-[#11151F]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#1F2937] hover:bg-transparent">
                            <TableHead className="text-[#E5E7EB]">Candidato</TableHead>
                            <TableHead className="text-[#E5E7EB]">Rol Actual</TableHead>
                            <TableHead className="text-[#E5E7EB]">Estado</TableHead>
                            <TableHead className="text-[#E5E7EB]">Score Final</TableHead>
                            <TableHead className="text-[#E5E7EB]">Clasificación</TableHead>
                            <TableHead className="text-right text-[#E5E7EB]">Acciones</TableHead>
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
                            // Extract first evaluation if exists (assuming 1 per candidate for MVP)
                            const evalData = c.evaluations && c.evaluations.length > 0 ? c.evaluations[0] : null
                            const status = evalData?.status === 'completed' ? 'Completado' : evalData?.status === 'draft' ? 'En progreso' : 'No iniciada'

                            return (
                                <TableRow key={c.id} className="border-[#1F2937] hover:bg-[#1F2937]/50">
                                    <TableCell className="font-medium text-[#E5E7EB]">{c.full_name || 'Candidato Sin Nombre'}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.role}</TableCell>
                                    <TableCell>
                                        {status === 'Completado' ? (
                                            <span className="text-emerald-400">Completado</span>
                                        ) : (
                                            <span className="text-amber-400">{status}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-lg text-[#E5E7EB]">
                                        {evalData?.final_score !== null && evalData?.final_score !== undefined ? evalData.final_score : '-'}
                                    </TableCell>
                                    <TableCell>{getClassBadge(evalData?.classification)}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/evaluator/evaluate/${c.id}`}>
                                            <Button variant={status === 'Completado' ? 'secondary' : 'default'} size="sm" className={status === 'Completado' ? 'bg-[#1F2937] text-white hover:bg-gray-700' : 'bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white'}>
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

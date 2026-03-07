import Link from 'next/link'
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

const MOCK_CANDIDATES = [
    { id: '1', name: 'Carlos Mendoza', role: 'Técnico L1', status: 'En progreso', score: null },
    { id: '2', name: 'Laura Gómez', role: 'Técnico L2', status: 'Completado', score: 85, classCode: 'ready' },
    { id: '3', name: 'Andrés Felipe', role: 'Técnico L1', status: 'Completado', score: 45, classCode: 'prep' },
    { id: '4', name: 'Diana Rincón', role: 'Técnico L2', status: 'Borrador', score: null },
]

function getClassBadge(code?: string) {
    switch (code) {
        case 'ready':
            return <Badge className="bg-[#10B981] text-white">Listo para pivotar</Badge>
        case 'level':
            return <Badge className="bg-[#F59E0B] text-white">Pivote con nivelación</Badge>
        case 'prep':
            return <Badge className="bg-[#F97316] text-white">En preparación</Badge>
        case 'opera':
            return <Badge className="bg-[#EF4444] text-white">Continúa en Ópera</Badge>
        default:
            return <Badge variant="outline" className="text-gray-400">Sin clasificar</Badge>
    }
}

export default function EvaluatorDashboard() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#00A3FF]">Dashboard de Evaluador</h1>
                    <p className="text-muted-foreground mt-2">
                        Supervisa y evalúa a los candidatos del programa Observability Talent Pivot.
                    </p>
                </div>
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
                        {MOCK_CANDIDATES.map((c) => (
                            <TableRow key={c.id} className="border-[#1F2937] hover:bg-[#1F2937]/50">
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell className="text-muted-foreground">{c.role}</TableCell>
                                <TableCell>{c.status}</TableCell>
                                <TableCell className="font-mono text-lg">{c.score !== null ? c.score : '-'}</TableCell>
                                <TableCell>{getClassBadge(c.classCode)}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/evaluator/evaluate/${c.id}`}>
                                        <Button variant={c.status === 'Completado' ? 'secondary' : 'default'} size="sm" className="bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white">
                                            {c.status === 'Completado' ? 'Ver Resultado' : 'Evaluar'}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

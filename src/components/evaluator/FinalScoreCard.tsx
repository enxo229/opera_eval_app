'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateDimensionA, calculateDimensionB, calculateDimensionC, calculateFinalScoreAndClassification, calculateDimensionIA } from '@/app/actions/evaluation'

export function FinalScoreCard({ evaluation }: { evaluation: any }) {
    const router = useRouter()
    const [isCalculating, setIsCalculating] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleCompleteEvaluation = async () => {
        setIsCalculating(true)
        setErrorMsg('')
        const supabase = createClient()

        // 1. Fetch all saved dimension scores 
        const { data: scoresResult } = await supabase
            .from('dimension_scores')
            .select('*')
            .eq('evaluation_id', evaluation.id)

        const scores = (scoresResult as any[]) || []

        if (scores.length === 0) {
            setErrorMsg('No hay calificaciones guardadas aún. Por favor completa los formularios de las Dimensiones A, B y C primero y presiona "Guardar" en cada uno.')
            setIsCalculating(false)
            return
        }

        // Helper
        const getRaw = (cat: string) => scores.find(s => s.category === cat)?.raw_score || 0

        // 2. Build Objects for calculations
        const dimAScores = {
            a1: getRaw('A1'),
            a2: getRaw('A2'),
            a3: getRaw('A3'),
            a4: getRaw('A4')
        }
        const dimBScores = {
            b1: getRaw('B1'),
            b2: getRaw('B2'),
            b3: getRaw('B3'),
            b4: getRaw('B4'),
            b5: getRaw('B5'),
            b6: getRaw('B6')
        }
        const dimCScores = {
            c1: getRaw('C1'),
            c2: getRaw('C2'),
            c3: getRaw('C3'),
            c4: getRaw('C4')
        }
        const dimDScores = {
            ia1: getRaw('IA-1'),
            ia2: getRaw('IA-2')
        }

        try {
            // 3. Run Calculations
            const subA = await calculateDimensionA(dimAScores)
            const subB = await calculateDimensionB(dimBScores)
            const subC = await calculateDimensionC(dimCScores)
            const subIA = await calculateDimensionIA(dimDScores)

            const finalResult = await calculateFinalScoreAndClassification(subA, subB, subC)

            // 4. Update the Evaluation row
            // @ts-ignore
            const { error: updateErr } = await supabase
                .from('evaluations')
                .update({
                    score_a: subA,
                    score_b: subB,
                    score_c: subC,
                    score_ia: subIA,
                    final_score: finalResult.score,
                    classification: finalResult.classification,
                    status: 'completed'
                } as any)
                .eq('id', evaluation.id)

            if (updateErr) throw updateErr

            router.refresh()
            router.push('/evaluator') // Back to dashboard
        } catch (e: any) {
            console.error('Error saving calculations:', e)
            setErrorMsg('Hubo un error de base de datos calculando los totales. Reintenta en unos instantes.')
        } finally {
            setIsCalculating(false)
        }
    }

    return (
        <Card className="border-border shadow-sm sticky top-8">
            <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-4 drop-shadow-sm border-b pb-2">Dictamen Final</h3>

                <div className="space-y-4 mb-6 text-sm">
                    <div className="flex justify-between items-center text-muted-foreground font-mono">
                        <span>Subtotal Dim A</span>
                        <span className="font-bold text-foreground">{evaluation.score_a !== null ? evaluation.score_a : '-'} / 50</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground font-mono">
                        <span>Subtotal Dim B</span>
                        <span className="font-bold text-foreground">{evaluation.score_b !== null ? evaluation.score_b : '-'} / 30</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground font-mono">
                        <span>Subtotal Dim C</span>
                        <span className="font-bold text-foreground">{evaluation.score_c !== null ? evaluation.score_c : '-'} / 20</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border border-border">
                        <span className="font-bold text-foreground font-mono">Puntaje Final Global</span>
                        <span className="text-xl font-black text-primary font-mono">{evaluation.final_score !== null ? evaluation.final_score : '-'} / 100</span>
                    </div>

                    {/* AI Score distinct box */}
                    {evaluation.score_ia !== null && (
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Habilidad Transversal Requerida</h4>
                            <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <span className="font-bold text-indigo-900 font-mono text-sm">Competencia IA</span>
                                <span className="text-lg font-black text-indigo-600 font-mono">{evaluation.score_ia} <span className="text-sm font-normal">/ 10</span></span>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Asegúrate de haber guardado ("Guardar Dimensión X") en cada una de las tres pestañas de la izquierda antes de emitir el dictamen.
                </p>

                {errorMsg && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm mb-4 font-semibold">
                        {errorMsg}
                    </div>
                )}

                <Button
                    onClick={handleCompleteEvaluation}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold drop-shadow-md py-6 text-md"
                    disabled={evaluation.status === 'completed' || isCalculating}
                >
                    {isCalculating ? 'Calculando y Guardando...' : evaluation.status === 'completed' ? 'Evaluación Finalizada' : 'Generar Dictamen Definitivo'}
                </Button>
            </CardContent>
        </Card>
    )
}

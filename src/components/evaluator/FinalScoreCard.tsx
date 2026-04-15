'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { finalizeEvaluationAndGenerateReport } from '@/app/actions/evaluator/reports'
import { FileText, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function FinalScoreCard({ evaluation }: { evaluation: any }) {
    const router = useRouter()
    const [isCalculating, setIsCalculating] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)

    const handleConfirmClick = () => {
        setShowConfirm(true)
    }

    const confirmFinalize = async () => {
        setShowConfirm(false)
        setIsCalculating(true)
        setErrorMsg('')

        try {
            const result = await finalizeEvaluationAndGenerateReport(evaluation.id)
            if (result.success) {
                router.refresh()
                router.push(`/evaluator/report/${evaluation.id}`)
            }
        } catch (e: any) {
            console.error('Error finalizing evaluation:', e)
            setErrorMsg(e.message || 'Hubo un error al generar el dictamen. Reintenta en unos instantes.')
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

                {evaluation.status !== 'completed' && (
                    <p className="text-sm text-muted-foreground mb-6">
                        Asegúrate de haber guardado cada pestaña antes de generar el dictamen con IA.
                    </p>
                )}

                {errorMsg && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm mb-4 font-semibold">
                        {errorMsg}
                    </div>
                )}

                <div className="space-y-3">
                    {evaluation.status === 'completed' ? (
                        <Button
                            onClick={() => router.push(`/evaluator/report/${evaluation.id}`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-md shadow-md gap-2"
                        >
                            <FileText className="h-5 w-5" /> Ver Reporte Ejecutivo
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConfirmClick}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-md shadow-md gap-2"
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generando Reporte con IA...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 fill-current" />
                                    Generar Dictamen con IA
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>

            {/* Finalize Confirmation Modal */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Finalizar Evaluación
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                        <p className="text-foreground font-medium text-lg">¿Estás seguro de generar el dictamen final?</p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Esta acción marcará la evaluación y el proceso de selección como **COMPLETADOS**. 
                            Ya no podrás modificar los puntajes ni comentarios después de este paso.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmFinalize} className="bg-primary hover:bg-primary/90 text-white font-bold">
                            Confirmar y Finalizar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

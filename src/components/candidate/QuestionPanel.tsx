'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, HelpCircle } from 'lucide-react'

type QuestionPanelProps = {
    questions: string[]
    loading: boolean
    onSubmit: (answers: string[]) => void
    submitted: boolean
    title: string
}

export function QuestionPanel({ questions, loading, onSubmit, submitted, title }: QuestionPanelProps) {
    const [answers, setAnswers] = useState<string[]>(questions.map(() => ''))

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }

    // Sync answers array length when questions change
    if (answers.length !== questions.length && questions.length > 0) {
        setAnswers(questions.map(() => ''))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Generando preguntas personalizadas...</span>
            </div>
        )
    }

    if (questions.length === 0) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h4 className="font-bold text-foreground">{title}</h4>
                {submitted && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </div>

            {questions.map((question, i) => (
                <div key={i} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                    <label className="text-sm font-semibold text-foreground block">
                        Pregunta {i + 1}:
                    </label>
                    <p className="text-sm text-muted-foreground mb-2">{question}</p>
                    <textarea
                        value={answers[i] || ''}
                        onChange={e => handleAnswerChange(i, e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        disabled={submitted}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                </div>
            ))}

            {!submitted && (
                <Button
                    onClick={() => onSubmit(answers)}
                    disabled={answers.some(a => !a.trim())}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    Guardar Respuestas
                </Button>
            )}
        </div>
    )
}

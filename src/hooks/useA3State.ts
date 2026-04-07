import { useState, useCallback, useEffect } from 'react'
import { A3Question, generateQuestionsA3 } from '@/app/actions/ai'
import { saveA3QuestionsOnly, saveA3Responses } from '@/app/actions/candidate/a3'
import { useCandidateContext, RestoredA3 } from '@/context/CandidateContext'

export function useA3State(educationLevel: string, evaluationId: string | null, restored: RestoredA3 | null) {
    const [a3Commands, setA3Commands] = useState<string[]>([])
    const [a3Questions, setA3Questions] = useState<A3Question[]>([])
    const [a3Answers, setA3Answers] = useState<Record<string, string>>({})
    const [a3QuestionsLoading, setA3QuestionsLoading] = useState(false)
    const [a3QuestionsGenerated, setA3QuestionsGenerated] = useState(false)
    const [a3Submitting, setA3Submitting] = useState(false)
    const [a3Submitted, setA3Submitted] = useState(false)
    const [a3AIResults, setA3AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // Restore state if provided
    useEffect(() => {
        if (restored && !a3QuestionsGenerated) {
            setA3Questions(restored.questions)
            setA3Answers(restored.answers)
            setA3Submitted(restored.submitted)
            setA3AIResults(restored.aiResults)
            setA3Commands(restored.commands)
            setA3QuestionsGenerated(true)
        }
    }, [restored, a3QuestionsGenerated])

    const handleGenerateA3Questions = useCallback(async () => {
        setA3QuestionsLoading(true)
        try {
            const questions = await generateQuestionsA3(educationLevel)
            setA3Questions(questions)
            setA3QuestionsGenerated(true)
            
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => {
                if (q.subcategory === 'A3.3') {
                    initialAnswers[q.subcategory] = `Número de Ticket: [AUTO-SETI-2026-001]\nTítulo: \nPrioridad: \nCategoría: \nDescripción del problema: \nPasos iniciales de revisión: `
                } else {
                    initialAnswers[q.subcategory] = ''
                }
            })
            setA3Answers(initialAnswers)

            if (evaluationId) {
                await saveA3QuestionsOnly(evaluationId, questions, initialAnswers)
            }
        } catch (e) {
            console.error('Error generating A3 questions:', e)
            setA3Questions([])
            setA3QuestionsGenerated(false)
        } finally {
            setA3QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    const handleSubmitA3 = useCallback(async () => {
        if (!evaluationId) return
        setA3Submitting(true)
        try {
            const qa = a3Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a3Answers[q.subcategory] || '',
            }))
            const result = await saveA3Responses(evaluationId, qa, a3Commands)
            if (result.success) {
                setA3Submitted(true)
                if (result.evaluations) setA3AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A3:', e)
        } finally {
            setA3Submitting(false)
        }
    }, [evaluationId, a3Questions, a3Answers, a3Commands])

    return {
        a3Commands, setA3Commands,
        a3Questions, setA3Questions,
        a3Answers, setA3Answers,
        a3QuestionsLoading, setA3QuestionsLoading,
        a3QuestionsGenerated, setA3QuestionsGenerated,
        a3Submitting, setA3Submitting,
        a3Submitted, setA3Submitted,
        a3AIResults, setA3AIResults,
        handleGenerateA3Questions,
        handleSubmitA3
    }
}

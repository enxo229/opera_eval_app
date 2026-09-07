'use client'

import { useState, useEffect } from 'react'
import { CQuestion, generateQuestionsC } from '@/app/actions/ai'
import { getCResults, saveCQuestionsOnly, saveCResponses } from '@/app/actions/candidate/c'

export function useCState(evaluationId: string | null, educationLevel: string, profileTrack?: string) {
    const [cQuestionsGenerated, setCQuestionsGenerated] = useState(false)
    const [cQuestionsLoading, setCQuestionsLoading] = useState(false)
    const [cQuestions, setCQuestions] = useState<CQuestion[]>([])
    const [cAnswers, setCAnswers] = useState<Record<string, string>>({})
    const [cSubmitted, setCSubmitted] = useState(false)
    const [cSubmitting, setCSubmitting] = useState(false)

    useEffect(() => {
        if (!evaluationId) return
        async function restoreState() {
            try {
                const state = await getCResults(evaluationId!)
                if (state.questions.length > 0) {
                    setCQuestions(state.questions)
                    setCQuestionsGenerated(true)
                    setCAnswers(state.answers)
                    setCSubmitted(state.submitted)
                }
            } catch (err) {
                console.error('Error restoring C state:', err)
            }
        }
        restoreState()
    }, [evaluationId])

    const handleGenerateCQuestions = async () => {
        if (!evaluationId) return
        setCQuestionsLoading(true)
        try {
            const questions = await generateQuestionsC(educationLevel, profileTrack)
            setCQuestions(questions)
            setCQuestionsGenerated(true)
            await saveCQuestionsOnly(evaluationId, questions)
        } catch (err) {
            console.error('Error generating C questions:', err)
        } finally {
            setCQuestionsLoading(false)
        }
    }

    const handleSubmitC = async () => {
        if (!evaluationId || cSubmitting) return
        setCSubmitting(true)
        try {
            const res = await saveCResponses(evaluationId, cAnswers)
            if (res.success) {
                setCSubmitted(true)
            } else {
                alert(`Error guardando Sección C: ${res.error}`)
            }
        } catch (err) {
            console.error('Error submitting C:', err)
            alert('Error al guardar respuestas de Sección C')
        } finally {
            setCSubmitting(false)
        }
    }

    const allCAnswered = cQuestions.length > 0 && cQuestions.every(q => (cAnswers[q.subcategory] || '').trim().length > 10)

    return {
        cQuestionsGenerated,
        cQuestionsLoading,
        cQuestions,
        cAnswers,
        setCAnswers,
        cSubmitted,
        cSubmitting,
        allCAnswered,
        handleGenerateCQuestions,
        handleSubmitC
    }
}

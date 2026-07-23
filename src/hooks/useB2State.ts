'use client'

import { useState, useEffect } from 'react'
import { BQuestion, generateQuestionsB } from '@/app/actions/ai'
import { getB2Results, saveB2QuestionsOnly, saveB2Responses } from '@/app/actions/candidate/b2'

export function useB2State(evaluationId: string | null, educationLevel: string, profileTrack?: string) {
    const [b2QuestionsGenerated, setB2QuestionsGenerated] = useState(false)
    const [b2QuestionsLoading, setB2QuestionsLoading] = useState(false)
    const [b2Questions, setB2Questions] = useState<BQuestion[]>([])
    const [b2Answers, setB2Answers] = useState<Record<string, string>>({})
    const [b2Submitted, setB2Submitted] = useState(false)
    const [b2Submitting, setB2Submitting] = useState(false)

    useEffect(() => {
        if (!evaluationId) return
        async function restoreState() {
            try {
                const state = await getB2Results(evaluationId!)
                if (state.questions.length > 0) {
                    setB2Questions(state.questions)
                    setB2QuestionsGenerated(true)
                    setB2Answers(state.answers)
                    setB2Submitted(state.submitted)
                }
            } catch (err) {
                console.error('Error restoring B2 state:', err)
            }
        }
        restoreState()
    }, [evaluationId])

    const handleGenerateB2Questions = async () => {
        if (!evaluationId) return
        setB2QuestionsLoading(true)
        try {
            const questions = await generateQuestionsB(educationLevel, profileTrack)
            setB2Questions(questions)
            setB2QuestionsGenerated(true)
            await saveB2QuestionsOnly(evaluationId, questions)
        } catch (err) {
            console.error('Error generating B2 questions:', err)
        } finally {
            setB2QuestionsLoading(false)
        }
    }

    const handleSubmitB2 = async () => {
        if (!evaluationId || b2Submitting) return
        setB2Submitting(true)
        try {
            const res = await saveB2Responses(evaluationId, b2Answers)
            if (res.success) {
                setB2Submitted(true)
            } else {
                alert(`Error guardando B2-B6: ${res.error}`)
            }
        } catch (err) {
            console.error('Error submitting B2:', err)
            alert('Error al guardar respuestas de B2-B6')
        } finally {
            setB2Submitting(false)
        }
    }

    const allB2Answered = b2Questions.length > 0 && b2Questions.every(q => (b2Answers[q.subcategory] || '').trim().length > 10)

    return {
        b2QuestionsGenerated,
        b2QuestionsLoading,
        b2Questions,
        b2Answers,
        setB2Answers,
        b2Submitted,
        b2Submitting,
        allB2Answered,
        handleGenerateB2Questions,
        handleSubmitB2
    }
}

import { useState, useCallback, useEffect } from 'react'
import { A1Question, generateQuestionsA1 } from '@/app/actions/ai'
import { saveA1QuestionsOnly, saveA1Responses } from '@/app/actions/candidate/a1'
import { RestoredA1 } from './useCandidateContext'

export function useA1State(educationLevel: string, evaluationId: string | null, restored: RestoredA1 | null) {
    const [a1Commands, setA1Commands] = useState<string[]>([])
    const [a1Questions, setA1Questions] = useState<A1Question[]>([])
    const [a1Answers, setA1Answers] = useState<Record<string, string>>({})
    const [a1QuestionsLoading, setA1QuestionsLoading] = useState(false)
    const [a1QuestionsGenerated, setA1QuestionsGenerated] = useState(false)
    const [a1Submitting, setA1Submitting] = useState(false)
    const [a1Submitted, setA1Submitted] = useState(false)
    const [a1AIResults, setA1AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // Restore state if provided
    useEffect(() => {
        if (restored && !a1QuestionsGenerated) {
            setA1Questions(restored.questions)
            setA1Answers(restored.answers)
            setA1Submitted(restored.submitted)
            setA1AIResults(restored.aiResults)
            setA1QuestionsGenerated(true)
        }
    }, [restored, a1QuestionsGenerated])

    const handleGenerateA1Questions = useCallback(async () => {
        setA1QuestionsLoading(true)
        setA1QuestionsGenerated(true)
        try {
            const questions = await generateQuestionsA1(educationLevel)
            setA1Questions(questions)
            
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => { initialAnswers[q.subcategory] = '' })
            setA1Answers(initialAnswers)

            if (evaluationId) {
                await saveA1QuestionsOnly(evaluationId, questions)
            }
        } catch {
            setA1Questions([])
            setA1QuestionsGenerated(false)
        } finally {
            setA1QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    const handleSubmitA1 = useCallback(async () => {
        if (!evaluationId) return
        setA1Submitting(true)
        try {
            const qa = a1Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a1Answers[q.subcategory] || '',
            }))
            const result = await saveA1Responses(evaluationId, qa)
            if (result.success) {
                setA1Submitted(true)
                if (result.evaluations) setA1AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A1:', e)
        } finally {
            setA1Submitting(false)
        }
    }, [evaluationId, a1Questions, a1Answers])

    const allA1Answered = a1Questions.length > 0 && a1Questions.every(q => (a1Answers[q.subcategory] || '').trim().length > 0)

    return {
        a1Commands, setA1Commands,
        a1Questions, setA1Questions,
        a1Answers, setA1Answers,
        a1QuestionsLoading, setA1QuestionsLoading,
        a1QuestionsGenerated, setA1QuestionsGenerated,
        a1Submitting, setA1Submitting,
        a1Submitted, setA1Submitted,
        a1AIResults, setA1AIResults,
        handleGenerateA1Questions,
        handleSubmitA1,
        allA1Answered
    }
}

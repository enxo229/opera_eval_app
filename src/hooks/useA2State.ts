import { useState, useCallback, useEffect } from 'react'
import { A2Question, generateQuestionsA2 } from '@/app/actions/ai'
import { saveA2QuestionsOnly, saveA2Responses } from '@/app/actions/candidate/a2'
import { useCandidateContext, RestoredA2 } from '@/context/CandidateContext'

export function useA2State(educationLevel: string, evaluationId: string | null, restored: RestoredA2 | null) {
    const [a2SelectedTool, setA2SelectedTool] = useState<string | null>(null)
    const [a2Questions, setA2Questions] = useState<A2Question[]>([])
    const [a2Answers, setA2Answers] = useState<Record<string, string>>({})
    const [a2QuestionsLoading, setA2QuestionsLoading] = useState(false)
    const [a2QuestionsGenerated, setA2QuestionsGenerated] = useState(false)
    const [a2Submitting, setA2Submitting] = useState(false)
    const [a2Submitted, setA2Submitted] = useState(false)
    const [a2AIResults, setA2AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // Restore state if provided
    useEffect(() => {
        if (restored && !a2QuestionsGenerated) {
            setA2SelectedTool(restored.tool)
            setA2Questions(restored.questions)
            setA2Answers(restored.answers)
            setA2Submitted(restored.submitted)
            setA2AIResults(restored.aiResults)
            setA2QuestionsGenerated(true)
        }
    }, [restored, a2QuestionsGenerated])

    const handleSelectTool = useCallback(async (tool: string) => {
        setA2SelectedTool(tool)
        setA2QuestionsLoading(true)
        setA2QuestionsGenerated(true)
        try {
            const questions = await generateQuestionsA2(tool, educationLevel)
            setA2Questions(questions)
            
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => { initialAnswers[q.subcategory] = '' })
            setA2Answers(initialAnswers)

            if (evaluationId) {
                await saveA2QuestionsOnly(evaluationId, tool, questions)
            }
        } catch {
            setA2Questions([])
            setA2QuestionsGenerated(false)
        } finally {
            setA2QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    const handleSubmitA2 = useCallback(async () => {
        if (!evaluationId || !a2SelectedTool) return
        setA2Submitting(true)
        try {
            const qa = a2Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a2Answers[q.subcategory] || '',
            }))
            const result = await saveA2Responses(evaluationId, a2SelectedTool, qa)
            if (result.success) {
                setA2Submitted(true)
                if (result.evaluations) setA2AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A2:', e)
        } finally {
            setA2Submitting(false)
        }
    }, [evaluationId, a2Questions, a2Answers, a2SelectedTool])

    return {
        a2SelectedTool, setA2SelectedTool,
        a2Questions, setA2Questions,
        a2Answers, setA2Answers,
        a2QuestionsLoading, setA2QuestionsLoading,
        a2QuestionsGenerated, setA2QuestionsGenerated,
        a2Submitting, setA2Submitting,
        a2Submitted, setA2Submitted,
        a2AIResults, setA2AIResults,
        handleSelectTool,
        handleSubmitA2
    }
}

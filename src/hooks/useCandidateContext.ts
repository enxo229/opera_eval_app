import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getA1Results } from '@/app/actions/candidate/a1'
import { getA2Results } from '@/app/actions/candidate/a2'
import { getA3Results } from '@/app/actions/candidate/a3'
import { A1Question, A2Question, A3Question } from '@/app/actions/ai'

export interface RestoredA1 {
    questions: A1Question[]
    answers: Record<string, string>
    submitted: boolean
    aiResults: { subcategory: string; score: number; justification: string }[] | null
}

export interface RestoredA2 {
    tool: string | null
    questions: A2Question[]
    answers: Record<string, string>
    submitted: boolean
    aiResults: { subcategory: string; score: number; justification: string }[] | null
}

export interface RestoredA3 {
    questions: A3Question[]
    answers: Record<string, string>
    submitted: boolean
    aiResults: { subcategory: string; score: number; justification: string }[] | null
    commands: string[]
}

export function useCandidateContext() {
    const [educationLevel, setEducationLevel] = useState<string>('')
    const [evaluationId, setEvaluationId] = useState<string | null>(null)
    const [contextLoaded, setContextLoaded] = useState(false)
    const [candidateName, setCandidateName] = useState<string>('')
    const [candidateEmail, setCandidateEmail] = useState<string>('')
    const [legalAccepted, setLegalAccepted] = useState(false)

    const [restoredA1, setRestoredA1] = useState<RestoredA1 | null>(null)
    const [restoredA2, setRestoredA2] = useState<RestoredA2 | null>(null)
    const [restoredA3, setRestoredA3] = useState<RestoredA3 | null>(null)

    useEffect(() => {
        async function loadContext() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get profile info
            const { data: profile } = await supabase.from('profiles').select('education_level, full_name').eq('id', user.id).single()
            if (profile?.education_level) setEducationLevel(profile.education_level)
            if (profile?.full_name) setCandidateName(profile.full_name)
            setCandidateEmail(user.email || '')

            // Get active evaluation based on active selection process
            const { data: activeProcess } = await supabase
                .from('selection_processes')
                .select('id')
                .eq('candidate_email', user.email)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle()

            let evaluation: { id: string } | undefined
            if (activeProcess) {
                const { data } = await supabase
                    .from('evaluations')
                    .select('id')
                    .eq('selection_process_id', activeProcess.id)
                    .limit(1)
                    .maybeSingle()
                if (data) evaluation = data
            }

            // Fallback for missing/legacy linkages
            if (!evaluation) {
                const { data: legacyData } = await supabase
                    .from('evaluations')
                    .select('id')
                    .eq('candidate_id', user.id)
                    .limit(1)
                    .maybeSingle()
                
                if (legacyData) {
                    evaluation = legacyData
                    // Self-heal: Link this orphaned evaluation to the active process if one exists
                    if (activeProcess) {
                        await supabase.from('evaluations').update({ selection_process_id: activeProcess.id }).eq('id', legacyData.id)
                    }
                }
            }

            if (evaluation) {
                setEvaluationId(evaluation.id)
                
                // Get legal consent status
                const { data: evalData } = await supabase
                    .from('evaluations')
                    .select('legal_consent_tc, legal_consent_data')
                    .eq('id', evaluation.id)
                    .single()
                
                if (evalData?.legal_consent_tc && evalData?.legal_consent_data) {
                    setLegalAccepted(true)
                    console.log(' Legal accepted for evaluation:', evaluation.id)
                } else {
                    console.warn(' Legal NOT accepted for evaluation:', evaluation.id, evalData)
                }

                // Load saved A1 responses if they exist
                const savedA1 = await getA1Results(evaluation.id)
                if (savedA1 && savedA1.length > 0) {
                    const questions: A1Question[] = savedA1.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A1.1' ? 'Linux' :
                            r.subcategory === 'A1.2' ? 'Windows Server' :
                                r.subcategory === 'A1.3' ? 'Redes' :
                                    r.subcategory === 'A1.4' ? 'Contenedores' : 'Cloud',
                        question: r.question,
                    }))
                    
                    const answers: Record<string, string> = {}
                    savedA1.forEach(r => { answers[r.subcategory] = r.answer })
                    
                    const isA1Submitted = savedA1.every(r => (r.answer || '').trim().length > 0)
                    
                    const aiResults = savedA1
                        .filter(r => r.ai_score !== null)
                        .map(r => ({
                            subcategory: r.subcategory,
                            score: r.ai_score!,
                            justification: r.ai_justification || '',
                        }))

                    setRestoredA1({ questions, answers, submitted: isA1Submitted, aiResults: aiResults.length > 0 ? aiResults : null })
                }

                // Load saved A2 responses if they exist
                const savedA2 = await getA2Results(evaluation.id)
                if (savedA2 && savedA2.length > 0) {
                    const tool = savedA2[0].tool
                    const questions: A2Question[] = savedA2.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A2.1' ? 'Monitoreo vs Observabilidad' :
                            r.subcategory === 'A2.2' ? 'Tres Pilares' :
                                r.subcategory === 'A2.3' ? `Dashboards` :
                                    r.subcategory === 'A2.4' ? 'Búsqueda de Logs' : 'Interpretación de Alertas',
                        question: r.question,
                    }))
                    const answers: Record<string, string> = {}
                    savedA2.forEach(r => { answers[r.subcategory] = r.answer })
                    
                    const isA2Submitted = savedA2.every(r => (r.answer || '').trim().length > 0)
                    
                    const aiResults = savedA2
                        .filter(r => r.ai_score !== null)
                        .map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                    
                    setRestoredA2({ tool, questions, answers, submitted: isA2Submitted, aiResults: aiResults.length > 0 ? aiResults : null })
                }

                // Load saved A3 responses if they exist
                const savedA3 = await getA3Results(evaluation.id)
                if (savedA3 && savedA3.length > 0) {
                    const questions: A3Question[] = savedA3.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A3.1' ? 'Git Básico' :
                            r.subcategory === 'A3.2' ? 'Scripting' :
                                r.subcategory === 'A3.3' ? 'Gestión ITSM' : 'Documentación',
                        question: r.question,
                    }))
                    const answers: Record<string, string> = {}
                    savedA3.forEach(r => { answers[r.subcategory] = r.answer })
                    
                    const isA3Submitted = savedA3.every(r => (r.answer || '').trim().length > 0)
                    
                    const aiResults = savedA3
                        .filter(r => r.ai_score !== null)
                        .map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))

                    let commands: string[] = []
                    const { data: terminalData } = await supabase.from('dynamic_tests').select('candidate_response')
                        .eq('evaluation_id', evaluation.id).eq('test_type', 'TERMINAL_A3').maybeSingle()
                    if (terminalData?.candidate_response) {
                        try {
                            commands = JSON.parse(terminalData.candidate_response)
                        } catch (e) {
                            console.error('Error parsing A3 terminal commands:', e)
                        }
                    }

                    setRestoredA3({ questions, answers, submitted: isA3Submitted, aiResults: aiResults.length > 0 ? aiResults : null, commands })
                }
            }
            setContextLoaded(true)
        }
        loadContext()
    }, [])

    return {
        educationLevel,
        evaluationId,
        contextLoaded,
        candidateName,
        candidateEmail,
        restoredA1,
        restoredA2,
        restoredA3,
        legalAccepted,
    }
}

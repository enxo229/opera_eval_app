'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getA1Results } from '@/app/actions/candidate/a1'
import { getA2Results } from '@/app/actions/candidate/a2'
import { getA3Results } from '@/app/actions/candidate/a3'
import { A1Question, A2Question, A3Question } from '@/app/actions/ai'

// Re-using interfaces for clarity
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

interface CandidateContextType {
    educationLevel: string
    setEducationLevel: (val: string) => void
    evaluationId: string | null
    contextLoaded: boolean
    candidateName: string
    candidateEmail: string
    legalAccepted: boolean
    setLegalAccepted: (val: boolean) => void
    restoredA1: RestoredA1 | null
    restoredA2: RestoredA2 | null
    restoredA3: RestoredA3 | null
    // Timer
    startedAt: string | null
    setStartedAt: (val: string | null) => void
    testDuration: number
    remainingSeconds: number | null
    isTimeUp: boolean
    pausedAt: string | null
    setPausedAt: (val: string | null) => void
    totalPausedMs: number
    setTotalPausedMs: (val: number) => void
    pauseCount: number
    setPauseCount: React.Dispatch<React.SetStateAction<number>>
    isPaused: boolean
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined)

export const CandidateProvider = ({ children }: { children: ReactNode }) => {
    const [educationLevel, setEducationLevel] = useState<string>('')
    const [evaluationId, setEvaluationId] = useState<string | null>(null)
    const [contextLoaded, setContextLoaded] = useState(false)
    const [candidateName, setCandidateName] = useState<string>('')
    const [candidateEmail, setCandidateEmail] = useState<string>('')
    const [legalAccepted, setLegalAccepted] = useState(false)

    const [restoredA1, setRestoredA1] = useState<RestoredA1 | null>(null)
    const [restoredA2, setRestoredA2] = useState<RestoredA2 | null>(null)
    const [restoredA3, setRestoredA3] = useState<RestoredA3 | null>(null)

    // Timer State
    const [startedAt, setStartedAt] = useState<string | null>(null)
    const [testDuration, setTestDuration] = useState<number>(60)
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
    const [isTimeUp, setIsTimeUp] = useState(false)
    const [pausedAt, setPausedAt] = useState<string | null>(null)
    const [totalPausedMs, setTotalPausedMs] = useState<number>(0)
    const [pauseCount, setPauseCount] = useState<number>(0)

    useEffect(() => {
        async function loadContext() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Get profile info
                const { data: profile } = await supabase.from('profiles').select('education_level, full_name').eq('id', user.id).single()
                if (profile?.education_level) setEducationLevel(profile.education_level)
                if (profile?.full_name) setCandidateName(profile.full_name)
                setCandidateEmail(user.email || '')

                // Get active evaluation
                const { data: activeProcess, error: procError } = await supabase
                    .from('selection_processes')
                    .select('id')
                    .eq('candidate_email', user.email)
                    .eq('status', 'active')
                    .limit(1)
                    .maybeSingle()
                
                if (procError) console.error('Selection process error:', procError)

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

                if (evaluation) {
                    setEvaluationId(evaluation.id)
                    const { data: evalData } = await supabase
                        .from('evaluations')
                        .select('legal_consent_tc, legal_consent_data, started_at, test_duration_minutes, paused_at, total_paused_ms, pause_count')
                        .eq('id', evaluation.id)
                        .single()
                    
                    if (evalData?.legal_consent_tc && evalData?.legal_consent_data) setLegalAccepted(true)
                    if (evalData?.started_at) setStartedAt(evalData.started_at)
                    if (evalData?.test_duration_minutes) setTestDuration(evalData.test_duration_minutes)
                    if (evalData?.paused_at) setPausedAt(evalData.paused_at)
                    if (evalData?.total_paused_ms) setTotalPausedMs(Number(evalData.total_paused_ms))
                    if (evalData?.pause_count) setPauseCount(evalData.pause_count)

                    // Load saved responses and map them correctly
                    const [rA1, rA2, rA3] = await Promise.all([
                        getA1Results(evaluation.id),
                        getA2Results(evaluation.id),
                        getA3Results(evaluation.id)
                    ])

                    if (rA1 && rA1.length > 0) {
                        const questions: A1Question[] = rA1.map(r => ({
                            subcategory: r.subcategory,
                            label: r.subcategory === 'A1.1' ? 'Linux' :
                                r.subcategory === 'A1.2' ? 'Windows Server' :
                                r.subcategory === 'A1.3' ? 'Redes' :
                                r.subcategory === 'A1.4' ? 'Contenedores' : 'Cloud',
                            question: r.question,
                        }))
                        const answers: Record<string, string> = {}; rA1.forEach(r => answers[r.subcategory] = r.answer)
                        const aiRes = rA1.filter(r => r.ai_score !== null).map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                        setRestoredA1({ questions, answers, submitted: rA1.every(r => (r.answer || '').trim().length > 0), aiResults: aiRes.length > 0 ? aiRes : null })
                    }
                    
                    if (rA2 && rA2.length > 0) {
                        const questions: A2Question[] = rA2.map(r => ({
                            subcategory: r.subcategory,
                            label: r.subcategory === 'A2.1' ? 'Monitoreo vs Observabilidad' :
                                r.subcategory === 'A2.2' ? 'Tres Pilares' :
                                r.subcategory === 'A2.3' ? `Dashboards` :
                                r.subcategory === 'A2.4' ? 'Búsqueda de Logs' : 'Interpretación de Alertas',
                            question: r.question,
                        }))
                        const answers: Record<string, string> = {}; rA2.forEach(r => answers[r.subcategory] = r.answer)
                        const aiRes = rA2.filter(r => r.ai_score !== null).map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                        setRestoredA2({ tool: rA2[0].tool, questions, answers, submitted: rA2.every(r => (r.answer || '').trim().length > 0), aiResults: aiRes.length > 0 ? aiRes : null })
                    }

                    if (rA3 && rA3.length > 0) {
                        const questions: A3Question[] = rA3.map(r => ({
                            subcategory: r.subcategory,
                            label: r.subcategory === 'A3.1' ? 'Git Básico' :
                                r.subcategory === 'A3.2' ? 'Scripting' :
                                r.subcategory === 'A3.3' ? 'Gestión ITSM' : 'Documentación',
                            question: r.question,
                        }))
                        const answers: Record<string, string> = {}; rA3.forEach(r => answers[r.subcategory] = r.answer)
                        const aiRes = rA3.filter(r => r.ai_score !== null).map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                        
                        let commands: string[] = []
                        const { data: terminalData } = await supabase.from('dynamic_tests').select('candidate_response')
                            .eq('evaluation_id', evaluation.id).eq('test_type', 'TERMINAL_A3').maybeSingle()
                        if (terminalData?.candidate_response) {
                            try { commands = JSON.parse(terminalData.candidate_response) } catch (e) { console.error('A3 parse error:', e) }
                        }

                        setRestoredA3({ questions, answers, submitted: rA3.every(r => (r.answer || '').trim().length > 0), aiResults: aiRes.length > 0 ? aiRes : null, commands })
                    }
                }
            } catch (err) {
                console.error('Critical context error:', err)
            } finally {
                setContextLoaded(true)
            }
        }
        loadContext()
    }, [])

    // Timer countdown
    useEffect(() => {
        if (!startedAt) return
        const interval = setInterval(() => {
            const start = new Date(startedAt).getTime()
            const now = pausedAt ? new Date(pausedAt).getTime() : new Date().getTime()
            const elapsed = now - start - Number(totalPausedMs)
            const remaining = Math.max(0, Math.floor((testDuration * 60 * 1000 - elapsed) / 1000))
            setRemainingSeconds(remaining)
            if (remaining <= 0) setIsTimeUp(true)
        }, 1000)
        return () => clearInterval(interval)
    }, [startedAt, testDuration, pausedAt, totalPausedMs])

    // Poll for evaluator time adjustments (every 30s)
    useEffect(() => {
        if (!evaluationId || !startedAt) return
        const poll = setInterval(async () => {
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const { data } = await supabase
                .from('evaluations')
                .select('test_duration_minutes')
                .eq('id', evaluationId)
                .single()
            if (data?.test_duration_minutes && data.test_duration_minutes !== testDuration) {
                setTestDuration(data.test_duration_minutes)
            }
        }, 30000)
        return () => clearInterval(poll)
    }, [evaluationId, startedAt, testDuration])

    return (
        <CandidateContext.Provider value={{
            educationLevel, setEducationLevel, evaluationId, contextLoaded, candidateName, candidateEmail, legalAccepted, setLegalAccepted,
            restoredA1, restoredA2, restoredA3,
            startedAt, setStartedAt, testDuration, remainingSeconds, isTimeUp, 
            pausedAt, setPausedAt, totalPausedMs, setTotalPausedMs, pauseCount, setPauseCount,
            isPaused: !!pausedAt
        }}>
            {children}
        </CandidateContext.Provider>
    )
}

export const useCandidateContext = () => {
    const context = useContext(CandidateContext)
    if (context === undefined) throw new Error('useCandidateContext must be used within a CandidateProvider')
    return context
}

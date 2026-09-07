import React from 'react'
import { Bot, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface AiLikelihoodBadgeProps {
    percentage?: number
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
    indicators?: string[]
}

export function AiLikelihoodBadge({ percentage = 0, riskLevel, indicators }: AiLikelihoodBadgeProps) {
    const score = percentage ?? 0

    let colorStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300'
    let icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    let label = 'Humano'

    if (score >= 70 || riskLevel === 'HIGH') {
        colorStyle = 'bg-rose-100 text-rose-900 border-rose-300'
        icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        label = 'Probabilidad IA Alta'
    } else if (score >= 30 || riskLevel === 'MEDIUM') {
        colorStyle = 'bg-amber-100 text-amber-900 border-amber-300'
        icon = <Bot className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        label = 'Duda IA / Asistido'
    }

    return (
        <div className="flex flex-col gap-1 my-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-xs ${colorStyle}`}>
                {icon}
                <span>Probabilidad de IA: <strong>{score}%</strong></span>
                <span className="opacity-75">({label})</span>
            </div>
            {indicators && indicators.length > 0 && percentage >= 30 && (
                <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/50 space-y-0.5">
                    <p className="font-semibold text-foreground/80">Indicadores detectados:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        {indicators.map((ind, idx) => (
                            <li key={idx}>{ind}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

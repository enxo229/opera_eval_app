'use client'

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts'

interface RadarChartProps {
    scoreA: number // Max 50
    scoreB: number // Max 30
    scoreC: number // Max 20
}

export function EvaluationRadarChart({ scoreA, scoreB, scoreC }: RadarChartProps) {
    // Normalizamos a escala 100 para que el polígono se dibuje de forma equitativa
    const data = [
        {
            subject: 'Dimensión Técnica (A)',
            score: (scoreA / 50) * 100,
            fullMark: 100,
        },
        {
            subject: 'Habilidades Blandas (B)',
            score: (scoreB / 30) * 100,
            fullMark: 100,
        },
        {
            subject: 'Actitud (C)',
            score: (scoreC / 20) * 100,
            fullMark: 100,
        },
    ]

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                    <PolarGrid stroke="#1F2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#E5E7EB', fontSize: 13 }} />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Aptitud"
                        dataKey="score"
                        stroke="#00A3FF"
                        fill="#00A3FF"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}

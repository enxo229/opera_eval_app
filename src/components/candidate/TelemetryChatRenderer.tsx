'use client'

import React, { useState } from 'react'
import { Terminal, Copy, Check, Activity, Search, ShieldAlert, Cpu } from 'lucide-react'

interface Props {
    content: string
    isAi?: boolean
    className?: string
}

export function TelemetryChatRenderer({ content, isAi = true, className = '' }: Props) {
    if (!isAi) {
        return (
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${className}`}>
                {content}
            </div>
        )
    }

    // Regex to split text by markdown code blocks: ```language? ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Text before the block
        if (match.index > lastIndex) {
            const rawText = content.substring(lastIndex, match.index)
            elements.push(
                <NormalTextSection key={`text-${lastIndex}`} text={rawText} />
            )
        }

        const rawLang = match[1]?.trim() || 'text'
        const code = match[2]?.trim() || ''

        elements.push(
            <TelemetryConsoleBlock 
                key={`block-${match.index}`} 
                code={code} 
                language={rawLang} 
            />
        )

        lastIndex = match.index + match[0].length
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
        const remaining = content.substring(lastIndex)
        elements.push(
            <NormalTextSection key={`text-${lastIndex}`} text={remaining} />
        )
    }

    // If no markdown blocks were found at all, check if content has CLI headers or logs
    if (elements.length === 0) {
        return <NormalTextSection text={content} />
    }

    return (
        <div className={`space-y-2.5 ${className}`}>
            {elements}
        </div>
    )
}

/**
 * Renders plain text with bullet points, bold markers, and interactive badges for Loki/PromQL/k8s
 */
function NormalTextSection({ text }: { text: string }) {
    const lines = text.split('\n')

    return (
        <div className="space-y-1.5 text-sm leading-relaxed">
            {lines.map((line, idx) => {
                const trimmed = line.trim()
                if (!trimmed) {
                    return <div key={idx} className="h-0.5" />
                }

                // Section Headers (e.g. === SYMPTOMS === or SUGERENCIAS DE INVESTIGACIÓN)
                if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
                    const headerTitle = trimmed.replace(/===/g, '').trim()
                    return (
                        <div key={idx} className="pt-2 pb-1 flex items-center gap-2 text-xs font-black tracking-wider uppercase text-amber-500 dark:text-amber-400">
                            <Activity className="h-3.5 w-3.5" />
                            <span>{headerTitle}</span>
                        </div>
                    )
                }

                if (/^(SUGERENCIAS|ANOMALÍAS|ACCIONES RECOMENDADAS|FUENTES DE DATOS)/i.test(trimmed)) {
                    return (
                        <div key={idx} className="pt-1.5 font-bold text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
                            <Search className="h-3.5 w-3.5 text-primary" />
                            <span>{trimmed}</span>
                        </div>
                    )
                }

                return (
                    <div key={idx} className="leading-relaxed">
                        {renderInlineSegments(line)}
                    </div>
                )
            })}
        </div>
    )
}

/**
 * Parses inline backticks and turns them into styled badges with copy capability for queries
 */
function renderInlineSegments(line: string): React.ReactNode[] {
    const parts = line.split(/(`[^`]+`)/g)

    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
            const raw = part.slice(1, -1).trim()
            return <InlineQueryChip key={i} queryText={raw} />
        }

        // Bold formatting **text**
        if (part.includes('**')) {
            const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
            return (
                <span key={i}>
                    {boldParts.map((bp, bIdx) => {
                        if (bp.startsWith('**') && bp.endsWith('**')) {
                            return <strong key={bIdx} className="font-bold text-foreground">{bp.slice(2, -2)}</strong>
                        }
                        return <span key={bIdx}>{bp}</span>
                    })}
                </span>
            )
        }

        return <span key={i}>{part}</span>
    })
}

/**
 * Interactive Chip for queries (PromQL, Loki, kubectl, etc.)
 */
function InlineQueryChip({ queryText }: { queryText: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        // If it starts with prefix like "loki: ", extract query
        const clean = queryText.replace(/^(loki|promql|k8s|kubectl):\s*/i, '').trim()
        navigator.clipboard.writeText(clean || queryText)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
    }

    let badgeColor = 'bg-primary/10 text-primary border-primary/20'
    let icon = <Terminal className="h-3 w-3" />

    if (/^loki:/i.test(queryText) || queryText.includes('{app=')) {
        icon = <Search className="h-3 w-3 text-cyan-500" />
        badgeColor = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
    } else if (/^promql:/i.test(queryText) || queryText.includes('rate(') || queryText.includes('sum(')) {
        icon = <Activity className="h-3 w-3 text-amber-500" />
        badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    } else if (/^(k8s|kubectl):/i.test(queryText) || queryText.startsWith('kubectl ')) {
        icon = <Cpu className="h-3 w-3 text-blue-500" />
        badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
    }

    return (
        <span 
            onClick={handleCopy}
            title="Haz clic para copiar esta consulta"
            className={`inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 my-0.5 rounded-md border font-medium cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-2xs ${badgeColor}`}
        >
            {icon}
            <span className="truncate max-w-[320px] sm:max-w-none">{queryText}</span>
            {copied ? (
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
                <Copy className="h-2.5 w-2.5 opacity-50 hover:opacity-100 shrink-0" />
            )}
        </span>
    )
}

/**
 * Dedicated Dark Observability Console block for CLI / Telemetry outputs
 */
function TelemetryConsoleBlock({ code }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Extract first line if it looks like a CLI/Cluster Header
    const lines = code.split('\n')
    const hasHeaderLine = lines[0] && (lines[0].startsWith('[') || lines[0].includes('OBSERVABILITY') || lines[0].includes('Cluster:'))
    const headerTitle = hasHeaderLine ? lines[0].replace(/[\[\]]/g, '') : 'TELEMETRÍA & OBSERVABILIDAD'
    const bodyLines = hasHeaderLine ? lines.slice(1) : lines

    return (
        <div className="my-2.5 rounded-xl overflow-hidden border border-[#2d3748] bg-[#0b0f19] shadow-lg font-mono text-xs">
            {/* Console Top Window Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#141b2d] border-b border-[#2d3748]">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-400 truncate tracking-wide flex items-center gap-1.5">
                        <Terminal className="h-3 w-3 text-sky-400 shrink-0" />
                        {headerTitle}
                    </span>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition-colors shrink-0 ml-2"
                    title="Copiar contenido de la consola"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copiado</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                        </>
                    )}
                </button>
            </div>

            {/* Console Body with syntax highlights for metrics, logs and queries */}
            <div className="p-3.5 overflow-x-auto max-h-[340px] overflow-y-auto space-y-1 bg-[#0b0f19] text-[#e2e8f0] leading-relaxed">
                {bodyLines.map((line, idx) => {
                    const trimmed = line.trim()
                    if (!trimmed) {
                        return <div key={idx} className="h-1.5" />
                    }

                    // Section headers inside console (e.g. === DETECTED ANOMALIES ===)
                    if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
                        return (
                            <div key={idx} className="pt-2 pb-1 font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                                <span>{trimmed.replace(/===/g, '').trim()}</span>
                            </div>
                        )
                    }

                    return (
                        <div key={idx} className="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap">
                            {formatTelemetryLine(line)}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Highlights metrics (500, 504, p99, ms, Loki queries, PromQL) inside console lines
 */
function formatTelemetryLine(line: string): React.ReactNode {
    // If line contains embedded queries `promql: ...` or `loki: ...`
    if (line.includes('`')) {
        return renderInlineSegments(line)
    }

    // Highlight critical errors (HTTP 500, 504, Timeout, Breached)
    if (/(500|504|Gateway Timeout|ConnectionPoolTimeout|breached|CRITICAL|ERROR|FAIL)/i.test(line)) {
        return (
            <span className="text-rose-300 font-medium">
                {highlightKeywords(line, [
                    { regex: /(HTTP 500|HTTP 504|504 Gateway Timeout|ConnectionPoolTimeoutException|breached)/gi, className: 'bg-rose-950/80 text-rose-300 px-1 py-0.5 rounded border border-rose-800/60 font-bold' },
                    { regex: /(\d+\.?\d*%\s*error|\d+\.?\d*%\s*current)/gi, className: 'text-rose-400 font-bold' },
                    { regex: /(p99:\s*[\d\.]+s|Timeout)/gi, className: 'bg-amber-950/80 text-amber-300 px-1 py-0.5 rounded border border-amber-800/60 font-bold' }
                ])}
            </span>
        )
    }

    // Highlight Latency / Performance metrics
    if (/(p50:|p95:|p99:|Response Time|Baseline:)/i.test(line)) {
        return (
            <span className="text-slate-300">
                {highlightKeywords(line, [
                    { regex: /(p50:\s*[\d\.]+[ms]+|Baseline:\s*[\d\.]+%)/gi, className: 'text-emerald-400 font-semibold' },
                    { regex: /(p99:\s*[\d\.]+[ms]+)/gi, className: 'text-amber-400 font-bold' },
                    { regex: /(->\s*[\d\.]+[ms]+)/gi, className: 'text-rose-400 font-bold' }
                ])}
            </span>
        )
    }

    // Default line
    return <span className="text-slate-300">{line}</span>
}

function highlightKeywords(text: string, rules: { regex: RegExp; className: string }[]): React.ReactNode {
    // Basic multi-rule tokenizer
    let result: (string | { matched: string; className: string })[] = [text]

    for (const rule of rules) {
        const nextResult: (string | { matched: string; className: string })[] = []
        for (const item of result) {
            if (typeof item !== 'string') {
                nextResult.push(item)
                continue
            }
            const parts = item.split(rule.regex)
            if (parts.length === 1) {
                nextResult.push(item)
                continue
            }
            let matchIdx = 0
            const matches = item.match(rule.regex) || []
            for (let i = 0; i < parts.length; i++) {
                if (parts[i]) nextResult.push(parts[i])
                if (matchIdx < matches.length && i < parts.length - 1) {
                    nextResult.push({ matched: matches[matchIdx], className: rule.className })
                    matchIdx++
                }
            }
        }
        result = nextResult
    }

    return result.map((item, i) => {
        if (typeof item === 'string') return <span key={i}>{item}</span>
        return <span key={i} className={item.className}>{item.matched}</span>
    })
}

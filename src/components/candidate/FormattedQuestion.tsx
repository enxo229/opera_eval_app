'use client'

import React, { useState } from 'react'
import { Check, Copy, Code2 } from 'lucide-react'

interface Props {
    text: string
    className?: string
}

export function FormattedQuestion({ text, className = '' }: Props) {
    // Regex to detect markdown code blocks: ```language\n code \n```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g

    const elements: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(text)) !== null) {
        // Text before the code block
        if (match.index > lastIndex) {
            const normalText = text.substring(lastIndex, match.index)
            elements.push(
                <TextRenderer key={`text-${lastIndex}`} text={normalText} />
            )
        }

        const language = match[1]?.trim() || 'python'
        const codeContent = match[2]?.trim() || ''

        elements.push(
            <CodeBlockRenderer 
                key={`code-${match.index}`} 
                code={codeContent} 
                language={language} 
            />
        )

        lastIndex = match.index + match[0].length
    }

    // Remaining text after the last code block
    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex)
        elements.push(
            <TextRenderer key={`text-${lastIndex}`} text={remainingText} />
        )
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {elements}
        </div>
    )
}

function TextRenderer({ text }: { text: string }) {
    // Split lines to format paragraphs, list items, and inline backticks
    const lines = text.split('\n')

    return (
        <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
            {lines.map((line, lineIdx) => {
                if (!line.trim()) {
                    return <div key={lineIdx} className="h-1" />
                }

                return (
                    <p key={lineIdx} className="leading-relaxed">
                        {renderInlineFormatting(line)}
                    </p>
                )
            })}
        </div>
    )
}

function renderInlineFormatting(line: string): React.ReactNode[] {
    const parts = line.split(/(`[^`]+`)/g)
    return parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
            const inlineCode = part.slice(1, -1)
            return (
                <code 
                    key={idx} 
                    className="bg-primary/10 text-primary font-mono text-xs px-1.5 py-0.5 rounded border border-primary/20 font-semibold"
                >
                    {inlineCode}
                </code>
            )
        }
        return <span key={idx}>{part}</span>
    })
}

function CodeBlockRenderer({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false)
    const codeLines = code.split('\n')

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const displayLang = language ? language.toUpperCase() : 'PYTHON'

    return (
        <div className="my-3 rounded-xl overflow-hidden border border-[#2a2b3d] bg-[#1a1b26] shadow-md font-mono text-xs sm:text-sm">
            {/* Code Block Top Header */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#13141f] border-b border-[#2a2b3d]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider text-[#7aa2f7] uppercase flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        {displayLang}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-[#565f89] hover:text-[#c0caf5] transition-colors px-2 py-0.5 rounded hover:bg-white/5"
                    title="Copiar código"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiado</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code lines with syntax high-contrast styling */}
            <div className="p-3.5 overflow-x-auto">
                <table className="w-full border-collapse">
                    <tbody>
                        {codeLines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.03] transition-colors leading-5">
                                <td className="select-none pr-3 text-right text-[#565f89] text-[11px] w-6 align-top font-normal">
                                    {idx + 1}
                                </td>
                                <td className="text-[#c0caf5] whitespace-pre pl-1 font-mono">
                                    {colorizePythonSyntax(line)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/**
 * Lightweight syntax colorizer for Python / Bash code snippets in questions.
 */
function colorizePythonSyntax(line: string): React.ReactNode {
    // Comments
    if (line.trim().startsWith('#')) {
        return <span className="text-[#565f89] italic">{line}</span>
    }

    // Split tokens by strings, keywords, etc.
    const tokens = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*")/g)

    return tokens.map((token, idx) => {
        // String literal
        if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
            return <span key={idx} className="text-[#9ece6a]">{token}</span>
        }

        // Keywords and functions
        const words = token.split(/\b/)
        return (
            <span key={idx}>
                {words.map((word, wIdx) => {
                    if (/^(import|from|as|def|return|if|elif|else|for|in|while|try|except|with|class|and|or|not|True|False|None)$/.test(word)) {
                        return <span key={wIdx} className="text-[#bb9af7] font-bold">{word}</span>
                    }
                    if (/^(pd|df|print|len|read_csv|read_json|groupby|agg|mean|sum|count|median|min|max|quantile|describe|filter)$/.test(word)) {
                        return <span key={wIdx} className="text-[#7dcfff]">{word}</span>
                    }
                    if (/^\d+(\.\d+)?$/.test(word)) {
                        return <span key={wIdx} className="text-[#ff9e64]">{word}</span>
                    }
                    return <span key={wIdx}>{word}</span>
                })}
            </span>
        )
    })
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { executeCommand, CommandResult } from '@/lib/terminal/commands'

type HistoryEntry = {
    command: string
    output: string
    isError: boolean
    cwd: string
}

type TerminalSandboxProps = {
    mode: 'A1' | 'A3'
    onCommandsChange?: (commands: string[]) => void
}

export function TerminalSandbox({ mode, onCommandsChange }: TerminalSandboxProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [input, setInput] = useState('')
    const [cwd, setCwd] = useState('/home/candidate')
    const [commandHistory, setCommandHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const focusInput = useCallback(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [history])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const { result, newCwd } = executeCommand(input, cwd, mode)

        if (result.output === '__CLEAR__') {
            setHistory([])
            setInput('')
            setCwd(newCwd)
            return
        }

        const newEntry: HistoryEntry = {
            command: input,
            output: result.output,
            isError: result.isError,
            cwd,
        }

        setHistory(prev => [...prev, newEntry])
        const newCommands = [...commandHistory, input]
        setCommandHistory(newCommands)
        setHistoryIndex(-1)
        setCwd(newCwd)
        setInput('')
        onCommandsChange?.(newCommands)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (commandHistory.length === 0) return
            const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex])
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIndex === -1) return
            const newIndex = historyIndex + 1
            if (newIndex >= commandHistory.length) {
                setHistoryIndex(-1)
                setInput('')
            } else {
                setHistoryIndex(newIndex)
                setInput(commandHistory[newIndex])
            }
        }
    }

    const welcomeMessage = mode === 'A1'
        ? '🖥️  Terminal Linux — Sandbox de Evaluación A1\nNavega el filesystem, inspecciona logs y procesos.\nEscribe "help" para ver comandos disponibles.\n'
        : '🔀  Terminal Git — Sandbox de Evaluación A3\nPractica comandos de Git y revisa scripts.\nEscribe "help" para ver comandos disponibles.\n'

    return (
        <div
            className="bg-[#1a1b26] rounded-xl border border-[#2a2b3d] shadow-lg overflow-hidden font-mono text-sm"
            onClick={focusInput}
        >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#13141f] border-b border-[#2a2b3d]">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[#565f89] text-xs ml-2">
                    {mode === 'A1' ? 'candidato@srv-prod-01' : 'candidato@srv-prod-01 (git)'}
                </span>
            </div>

            {/* Terminal body */}
            <div
                ref={scrollRef}
                className="p-4 h-[400px] overflow-y-auto cursor-text space-y-1"
            >
                {/* Welcome message */}
                <pre className="text-[#7aa2f7] whitespace-pre-wrap mb-3">{welcomeMessage}</pre>

                {/* History */}
                {history.map((entry, i) => (
                    <div key={i} className="space-y-0.5">
                        <div className="flex gap-0">
                            <span className="text-[#9ece6a]">candidato</span>
                            <span className="text-[#565f89]">@</span>
                            <span className="text-[#7dcfff]">srv-prod-01</span>
                            <span className="text-[#565f89]">:</span>
                            <span className="text-[#bb9af7]">{entry.cwd}</span>
                            <span className="text-[#565f89]">$ </span>
                            <span className="text-[#c0caf5]">{entry.command}</span>
                        </div>
                        {entry.output && (
                            <pre className={`whitespace-pre-wrap pl-0 ${entry.isError ? 'text-[#f7768e]' : 'text-[#a9b1d6]'}`}>
                                {entry.output}
                            </pre>
                        )}
                    </div>
                ))}

                {/* Active prompt */}
                <form onSubmit={handleSubmit} className="flex items-center gap-0">
                    <span className="text-[#9ece6a]">candidato</span>
                    <span className="text-[#565f89]">@</span>
                    <span className="text-[#7dcfff]">srv-prod-01</span>
                    <span className="text-[#565f89]">:</span>
                    <span className="text-[#bb9af7]">{cwd}</span>
                    <span className="text-[#565f89]">$ </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        className="flex-1 bg-transparent text-[#c0caf5] outline-none border-none caret-[#7aa2f7]"
                        autoFocus
                        spellCheck={false}
                        name="terminal-input"
                        autoComplete="one-time-code"
                    />
                </form>
            </div>
        </div>
    )
}

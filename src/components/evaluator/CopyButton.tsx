'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clipboard, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Error al copiar:', err)
        }
    }

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={handleCopy}
            title="Copiar feedback"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Copiado</span>
                </>
            ) : (
                <>
                    <Clipboard className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Copiar</span>
                </>
            )}
        </Button>
    )
}

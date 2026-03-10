'use client'

import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            // Show only when scrolled down a bit to avoid clutter at the very top
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    if (!isVisible) return null

    return (
        <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[99] rounded-full h-14 w-14 shadow-2xl bg-primary text-primary-foreground flex pb-1 items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all"
            title="Ir al principio"
        >
            <ArrowUp className="w-6 h-6" />
        </Button>
    )
}

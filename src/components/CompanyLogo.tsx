'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
    className?: string
    width?: number
    height?: number
}

export function CompanyLogo({ className, width = 120, height = 40 }: CompanyLogoProps) {
    return (
        <div className={cn("inline-flex items-center select-none", className)}>
            <Image
                src="/icons/SETILogoNoBG.png"
                alt="SETI Logo"
                width={width}
                height={height}
                className="h-auto w-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
                priority
            />
        </div>
    )
}

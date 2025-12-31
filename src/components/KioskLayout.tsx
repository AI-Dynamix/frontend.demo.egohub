import { useState, useEffect } from "react"
import type { ReactNode } from "react"

/**
 * KioskLayout - Base layout for kiosk screens
 * 
 * ONLY handles sizing and scaling to 1080x1920
 * Does NOT include background, header, or footer
 * 
 * All page-specific styling should be in child components
 */

interface KioskLayoutProps {
    children: ReactNode
    className?: string
}

export default function KioskLayout({ children, className = "" }: KioskLayoutProps) {
    // Scaling to fit viewport while maintaining 1080x1920 aspect ratio
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const updateScale = () => {
            const targetWidth = 1080
            const targetHeight = 1920
            const scaleX = window.innerWidth / targetWidth
            const scaleY = window.innerHeight / targetHeight
            setScale(Math.min(scaleX, scaleY, 1))
        }
        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    return (
        <div className="w-screen h-screen bg-[#020617] flex items-center justify-center overflow-hidden">
            <div
                className={`relative text-white font-sans ${className}`}
                style={{
                    width: 1080,
                    height: 1920,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                }}
            >
                {children}
            </div>
        </div>
    )
}

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useKioskSettings } from "../stores/kioskSettings"

// Background images for rotation
import background1 from "../assets/images/background/background1.webp"
import background2 from "../assets/images/background/background2.jpg"
import background3 from "../assets/images/background/background3.webp"
import background4 from "../assets/images/background/background4.webp"
import background5 from "../assets/images/background/background5.webp"
import background6 from "../assets/images/background/background6.webp"
import background7 from "../assets/images/background/background7.webp"

const backgroundImages = [background1, background2, background3, background4, background5, background6, background7]

interface HomeLayoutProps {
    children: ReactNode
    backgroundOverlay?: string
}

/**
 * HomeLayout - Layout with rotating background for Home page
 * Supports dark and light themes via kioskSettings
 */
export default function HomeLayout({
    children,
    backgroundOverlay
}: HomeLayoutProps) {
    const { theme } = useKioskSettings()

    // Background rotation logic
    const [currentBgIndex, setCurrentBgIndex] = useState(0)

    useEffect(() => {
        const bgInterval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length)
        }, 30000) // Every 30 seconds
        return () => clearInterval(bgInterval)
    }, [])

    // Theme-based styling
    const isLight = theme === 'light'
    const overlayClass = backgroundOverlay || (isLight
        ? "bg-gradient-to-b from-white/10 via-white/5 to-white/20"
        : "bg-gradient-to-b from-black/35 via-black/20 to-black/50")

    return (
        <div className={`h-full relative flex flex-col ${isLight ? 'light' : 'dark'}`}>
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute inset-0 z-10 ${overlayClass}`} />
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentBgIndex}
                        src={backgroundImages[currentBgIndex]}
                        alt="Background"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLight ? 1 : 0.85 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className={`w-full h-full object-cover absolute inset-0 ${isLight ? 'brightness-110 saturate-105' : ''}`}
                    />
                </AnimatePresence>
            </div>

            {/* Content Layer (Automatically responds to .light/.dark) */}
            <div className="relative z-10 h-full flex flex-col transition-colors duration-500">
                {children}
            </div>
        </div>
    )
}

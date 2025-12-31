/**
 * BootPage - Boot/Loading Screen (For Engineers)
 * 
 * PURPOSE: 
 * - Display loading when kiosk starts
 * - English only (for engineers/technicians)
 * - Engineering Mode access
 * - 5s countdown with large circle
 * 
 * FLOW: BootPage (here) → AttractionPage → SelectorPage → Home
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GearSix, CircleNotch, HandTap } from '@phosphor-icons/react'
import { AnimatedLogo } from '../../components/kiosk'
import { useSessionStore } from '../../stores/sessionStore'
import { passportOCRService } from '../../services/PassportOCRService'
import { useDebugStore } from '../../stores/debugStore'
import { useTranslation } from 'react-i18next'

const COUNTDOWN_SECONDS = 5

// Animated particles for background
const Particles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
                initial={{
                    x: Math.random() * 1080,
                    y: 1920 + Math.random() * 100,
                }}
                animate={{
                    y: -100,
                    opacity: [0, 0.8, 0]
                }}
                transition={{
                    duration: Math.random() * 8 + 8,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                }}
            />
        ))}
    </div>
)

export default function BootPage() {
    const navigate = useNavigate()
    const { i18n } = useTranslation()
    const isModelLoaded = useSessionStore((state) => state.isModelLoaded)
    const setBooted = useSessionStore((state) => state.setBooted)
    const isSimpleMode = useDebugStore((state) => state.isSimpleMode)

    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
    const [isPaused, setIsPaused] = useState(false)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Start countdown when model is loaded
    useEffect(() => {
        // Initialize OCR Service
        passportOCRService.load();

        if (isModelLoaded && !isPaused) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!)
                        handleContinue()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
        }
    }, [isModelLoaded, isPaused])

    const handleContinue = () => {
        setBooted(true)
        if (isSimpleMode) {
            i18n.changeLanguage('en')
            navigate('/home')
        } else {
            navigate('/welcome')
        }
    }

    const handleEngineeringMode = () => {
        setBooted(true)
        navigate('/engineering')
    }

    const handlePause = () => {
        setIsPaused(true)
        if (countdownRef.current) clearInterval(countdownRef.current)
    }

    const progress = (COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS

    return (
        <div className="h-full flex flex-col relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden">
            {/* Animated Background */}
            <Particles />

            {/* Gradient orbs */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px]"
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-16 relative"
                >
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-[60px] transition-opacity duration-1000 ${isModelLoaded ? 'opacity-40' : 'opacity-15'}`} />
                    <AnimatedLogo scale={2.5} />
                </motion.div>

                {/* Loading / Ready Status - English only */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-10 text-center"
                >
                    <div className="flex items-center justify-center gap-4">
                        {!isModelLoaded ? (
                            <>
                                <CircleNotch size={28} className="text-blue-400 animate-spin" />
                                <span className="text-white/80 text-2xl font-medium">Loading System...</span>
                            </>
                        ) : (
                            <span className="text-emerald-400 text-2xl font-medium">✓ System Ready</span>
                        )}
                    </div>

                    {/* Progress bar */}
                    {!isModelLoaded && (
                        <div className="mt-6 w-80 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3, ease: "easeInOut" }}
                            />
                        </div>
                    )}
                </motion.div>

                {/* Large Countdown Circle */}
                <AnimatePresence>
                    {isModelLoaded && !isPaused && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative w-40 h-40 mb-10"
                        >
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="6"
                                    fill="none"
                                />
                                <motion.circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="url(#countdown-gradient)"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={440}
                                    initial={{ strokeDashoffset: 440 }}
                                    animate={{ strokeDashoffset: 440 * (1 - progress) }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                                <defs>
                                    <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white">
                                {countdown}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Start Button - English only */}
                <AnimatePresence>
                    {isModelLoaded && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={isPaused ? handleContinue : handlePause}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-16 py-10 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:bg-white/20 transition-all flex flex-col items-center gap-4 cursor-pointer"
                        >
                            <motion.div
                                animate={isPaused ? {} : { y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="p-5 rounded-full bg-white/10 text-blue-400"
                            >
                                <HandTap size={56} weight="duotone" />
                            </motion.div>

                            <span className="text-3xl font-bold text-white tracking-widest uppercase">
                                {isPaused ? 'Continue' : 'Touch to Pause'}
                            </span>

                            <span className="text-lg text-white/50 tracking-[0.15em] group-hover:text-blue-300 transition-colors">
                                {isPaused ? 'PROCEED TO KIOSK' : 'OR WAIT FOR AUTO-START'}
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer - Engineering Mode */}
            <div className="absolute bottom-8 left-0 right-0 px-8 flex items-center justify-between z-10">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    onClick={handleEngineeringMode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                    <GearSix size={22} className="text-white/40 group-hover:text-white/70 transition-colors" weight="fill" />
                    <span className="text-white/40 group-hover:text-white/70 text-sm font-medium tracking-wide transition-colors">
                        Engineering Mode
                    </span>
                </motion.button>

                <p className="text-white/20 font-mono text-xs tracking-[0.2em]">
                    eGo Kiosk OS v2.0
                </p>

                <div className="w-40" />
            </div>
        </div>
    )
}

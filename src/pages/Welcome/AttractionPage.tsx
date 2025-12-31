/**
 * AttractionPage - Màn hình thu hút người dùng (Idle/Attraction Screen)
 * 
 * MỤC ĐÍCH: Chạy slideshow ảnh ngẫu nhiên để thu hút người dùng.
 *           Text đổi qua nhiều ngôn ngữ vì chưa biết user dùng ngôn ngữ gì.
 *           Phát hiện khuôn mặt và khoảng cách:
 *           - Face FAR: Hiện lời chào "Mời đến gần..."
 *           - Face CLOSE + 5s: Auto chuyển sang SelectorPage
 *           - Manual: Nhấn nút Start
 * 
 * FLOW: BootPage → AttractionPage (đây) → SelectorPage → Home
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandTap, Ruler } from '@phosphor-icons/react'
import { getVoiceAudioUrl } from '../../services/TTSService'
import { useKioskSettings } from '../../stores/kioskSettings'

// Import all background images
import background1 from '../../assets/images/background/background1.webp'
import background2 from '../../assets/images/background/background2.jpg'
import background3 from '../../assets/images/background/background3.webp'
import background4 from '../../assets/images/background/background4.webp'
import background5 from '../../assets/images/background/background5.webp'
import background6 from '../../assets/images/background/background6.webp'
import background7 from '../../assets/images/background/background7.webp'

const backgroundImages = [background1, background2, background3, background4, background5, background6, background7]

// Multi-language texts for rotating display
// TOUCH_TEXTS removed as unused
// const TOUCH_TEXTS = [...]

const GREETING_TEXTS = [
    { hello: 'Hello!', come: 'Please come closer...' },
    { hello: 'Xin chào!', come: 'Mời bạn đến gần hơn...' },
    { hello: '你好!', come: '请靠近一点...' },
    { hello: 'こんにちは!', come: 'もう少し近づいてください...' },
    { hello: '안녕하세요!', come: '더 가까이 오세요...' },
]

interface AttractionPageProps {
    onStart: () => void
    isFaceDetected?: boolean
    isFaceClose?: boolean
    faceProximityDuration?: number // How long face has been close (seconds)
}

export default function AttractionPage({
    onStart,
    isFaceDetected = false,
    isFaceClose = false
}: AttractionPageProps) {
    // Random background on mount
    const randomBgIndex = useMemo(() => Math.floor(Math.random() * backgroundImages.length), [])
    const [currentBgIndex, setCurrentBgIndex] = useState(randomBgIndex)
    const [isPerfect, setIsPerfect] = useState(false)
    const [countdown, setCountdown] = useState(2)

    // TTS limiting
    const lastSpeakTime = useRef<number>(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const {
        ttsThrottleDuration = 10000 // Default fallback
    } = useKioskSettings() || {}

    // Rotate background every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length)
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    // Handle "Perfect" state - LATCH logic
    // Once triggered, it stays true until unmount/navigation
    useEffect(() => {
        if (isFaceClose && !isPerfect) {
            setIsPerfect(true)
        }
    }, [isFaceClose])

    // Handle Countdown - Independent of Face Sensor once triggered
    useEffect(() => {
        if (!isPerfect) return

        const interval = setInterval(() => {
            setCountdown(prev => {
                const next = prev - 1
                if (next < 1) {
                    clearInterval(interval)
                    onStart() // Trigger navigation
                    return 0
                }
                return next
            })
        }, 700)

        return () => clearInterval(interval)
    }, [isPerfect, onStart])

    // ... Play Greeting Effect (unchanged) ...
    // Note: Since I am replacing the block containing the useEffect, I need to be careful not to delete the playGreeting effect if it overlaps.
    // The previous view shows playGreeting starts at line 91. My EndLine is 198, which is way down.
    // Wait, I should not replace the whole file content in one go if I can avoid it.
    // Let me split this.
    // 1. Add state (Need to find where to add it).
    // 2. Replace useEffect.
    // 3. Replace UI.

    // Actually, I can use `multi_replace_file_content` or just do it in chunks.
    // Let's do it in chunks. This specific call is targeting the useEffect logic.


    // Play TTS greeting when face is detected but far
    useEffect(() => {
        const playGreeting = async () => {
            const now = Date.now()
            if (now - lastSpeakTime.current < ttsThrottleDuration) return

            try {
                const url = await getVoiceAudioUrl({
                    text: "Hello, please come closer to start",
                    textId: "welcome_come_closer",
                    version: "v1",
                    langCode: "en"
                })

                if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current = null
                }
                const audio = new Audio(url)
                audioRef.current = audio
                audio.play().catch(e => console.error("Audio play failed:", e))
                lastSpeakTime.current = now
            } catch (error) {
                console.error("Failed to play greeting TTS:", error)
            }
        }

        if (isFaceDetected && !isFaceClose && !isPerfect) {
            playGreeting()
        }
    }, [isFaceDetected, isFaceClose, isPerfect, ttsThrottleDuration])

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Background Slideshow */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentBgIndex}
                        src={backgroundImages[currentBgIndex]}
                        alt="Background"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>
            </div>

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 z-10" />

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-20 h-full gap-12">

                {/* State 1: Face detected but far -> Show multi-language instructions */}
                <AnimatePresence>
                    {isFaceDetected && !isPerfect && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col gap-4 items-center max-w-4xl"
                        >
                            <Ruler size={128} className="text-blue-400 animate-pulse" weight="fill" />

                            <div className="flex flex-col gap-3 text-center">
                                {/* Marquee/List of languages */}
                                {GREETING_TEXTS.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-2 justify-center"
                                    >
                                        <span className="text-white font-bold text-5xl drop-shadow-md">{item.hello}</span>
                                        <span className="text-white/80 text-4xl">{item.come}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* State 2: Perfect Distance -> Show "Perfect" feedback */}
                <AnimatePresence>
                    {isPerfect && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1.1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <Ruler size={150} className="text-emerald-400" weight="fill" />
                                </motion.div>
                                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter filter drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                                    PERFECT!
                                </h1>
                                <p className="text-white/80 text-3xl font-mono tracking-widest uppercase flex items-center gap-4">
                                    Starting in <span className="text-emerald-400 font-bold text-4xl tabular-nums">{countdown}</span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Manual Start Button (Only visible if not Perfect) */}
                {!isPerfect && (
                    <motion.button
                        onClick={onStart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                    >
                        <div className="p-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <HandTap size={48} className="text-white" />
                        </div>
                        <span className="text-white/60 text-sm tracking-widest uppercase">Touch to Start</span>
                    </motion.button>
                )}
            </div>
        </div>
    )
}

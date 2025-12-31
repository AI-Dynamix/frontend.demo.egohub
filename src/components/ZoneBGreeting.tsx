import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getVoiceAudioUrl } from '../services/TTSService'
import { LANGUAGES } from '../constants/languages'

interface ZoneBGreetingProps {
    langCode: string
    onComplete: () => void
}

export default function ZoneBGreeting({ langCode, onComplete }: ZoneBGreetingProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [text, setText] = useState("")

    useEffect(() => {
        const safeLangCode = (langCode === 'vi' || langCode === 'vi-VN' || !langCode) ? 'vn' : langCode
        const langConfig = LANGUAGES.find(l => l.code === safeLangCode) || LANGUAGES[1]
        const textToSpeak = langConfig.welcome

        console.log("[ZoneBGreeting] Resolved Text:", textToSpeak, "for lang:", safeLangCode)

        // Show text immediately
        setText(textToSpeak)

        let fallbackTimer: ReturnType<typeof setTimeout>
        let hasFinished = false

        const finish = () => {
            if (hasFinished) return
            hasFinished = true
            console.log("[ZoneBGreeting] Finishing greeting flow")
            onComplete()
        }

        const runAudioFlow = async () => {
            // Safety net
            fallbackTimer = setTimeout(() => {
                console.warn("[ZoneBGreeting] Safety timeout reached (12s)")
                finish()
            }, 12000)

            try {
                console.log("[ZoneBGreeting] Requesting audio...")
                const url = await getVoiceAudioUrl({
                    text: textToSpeak,
                    textId: `home_greeting_${safeLangCode}`,
                    langCode: safeLangCode
                })

                if (audioRef.current) {
                    audioRef.current.pause()
                }

                const audio = new Audio(url)
                audioRef.current = audio

                audio.onended = () => {
                    console.log("[ZoneBGreeting] Audio ended naturally")
                    clearTimeout(fallbackTimer)
                    setTimeout(finish, 1500)
                }

                audio.onerror = (e) => {
                    console.error("[ZoneBGreeting] Audio element error:", e)
                    clearTimeout(fallbackTimer)
                    setTimeout(finish, 4000)
                }

                console.log("[ZoneBGreeting] Playing audio now...")
                await audio.play()
            } catch (error) {
                console.error("[ZoneBGreeting] TTS/Audio Fetch Error:", error)
                if (fallbackTimer) clearTimeout(fallbackTimer)
                setTimeout(finish, 5000)
            }
        }

        const audioTimer = setTimeout(runAudioFlow, 500)

        return () => {
            console.log("[ZoneBGreeting] Cleaning up...")
            clearTimeout(audioTimer)
            if (fallbackTimer) clearTimeout(fallbackTimer)
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [langCode, onComplete])

    return (
        <section className="px-12 h-[var(--h-upper)] shrink-0 flex items-center justify-center relative z-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-blue-600/30 backdrop-blur-3xl border-2 border-white/20 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center shadow-2xl overflow-hidden"
            >
                {/* Visual pulse effect in background */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="w-[900px] h-[900px] rounded-full bg-blue-400/10 blur-[120px]"
                    />
                </div>

                <div className="relative z-10 w-full max-w-5xl">
                    <AnimatePresence mode="wait">
                        {text ? (
                            <motion.div
                                key="text"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                                className="text-4xl font-extrabold text-white leading-tight mb-8 drop-shadow-md"
                            >
                                {text}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preparing"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-3xl text-white/50 font-bold italic"
                            >
                                Preparing your guide...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dynamic Voice Bars */}
                    <div className="flex justify-center items-center gap-4 h-24">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: text ? [30, 90, 30] : [12, 12, 12] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.7,
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                                className="w-5 bg-gradient-to-t from-blue-400 to-white rounded-full opacity-80 shadow-lg"
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    )
}

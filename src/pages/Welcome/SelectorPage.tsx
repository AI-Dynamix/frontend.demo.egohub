/**
 * SelectorPage - Màn hình chọn ngôn ngữ và chat AI (Language Selector & AI Chat)
 * 
 * MỤC ĐÍCH: Cho phép người dùng chọn ngôn ngữ hoặc nói chuyện với AI để được hướng dẫn.
 *           Hiển thị các flag ngôn ngữ và voice input.
 * 
 * FLOW: AttractionPage → SelectorPage (đây) → Home (với greeting)
 * 
 * TRIGGER: Khi user chọn ngôn ngữ → navigate tới Home với playGreeting flag
 */

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Header } from '../../components/kiosk'

import 'flag-icons/css/flag-icons.min.css'
import { getVoiceAudioUrl } from '../../services/TTSService'
import { generateAIResponse } from '../../services/AIService'
import ChatList from '../../components/features/chat/ChatList'
import VoiceControls from '../../components/features/chat/VoiceControls'
import HomeLayout from '../../layouts/HomeLayout'

// --- Configuration ---
import { LANGUAGES } from '../../constants/languages'

interface SelectorPageProps {
    onLanguageSelect: (lang: string) => void
}

export type Message = {
    id: string
    role: 'user' | 'ai'
    text: string
    timestamp: number
}

export default function SelectorPage({ onLanguageSelect }: SelectorPageProps) {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessingAI, setIsProcessingAI] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')

    // --- Refs ---
    const recognitionRef = useRef<any>(null)
    const processingRef = useRef(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isPlayingAudioRef = useRef(false) // Replaces state to avoid stale closures
    const isMountedRef = useRef(true)
    const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // --- Effects ---

    // 1. Initial Greeting & Cleanup
    useEffect(() => {
        const initialMsg: Message = {
            id: 'init-1',
            role: 'ai',
            text: "Please select a language or speak to start.",
            timestamp: Date.now()
        }
        setMessages([initialMsg])
        speak(initialMsg.text, 'en')

        return () => {
            isMountedRef.current = false // CRITICAL: Mark as unmounted immediately

            // CRITICAL CLEANUP: Kill Mic & Audio on unmount
            if (recognitionRef.current) {
                recognitionRef.current.abort()
                recognitionRef.current = null
            }
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            if (ttsTimerRef.current) {
                clearTimeout(ttsTimerRef.current)
                ttsTimerRef.current = null
            }
            setIsListening(false)
        }
    }, [])



    // --- Functions ---
    const stopListening = () => {
        if (recognitionRef.current) {
            // Use abort() to immediately stop capturing, preventing any pending results
            recognitionRef.current.abort()
            recognitionRef.current = null
            setIsListening(false)
        }
    }

    const startListening = () => {
        // Strict guard: No listening if processing or audio playing
        if (processingRef.current || isPlayingAudioRef.current) return

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition && !recognitionRef.current) {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'vi-VN' // Default listening lang

            let eagerTimer: ReturnType<typeof setTimeout> | null = null

            const triggerEagerly = async (text: string) => {
                if (processingRef.current) return
                processingRef.current = true
                if (eagerTimer) clearTimeout(eagerTimer)

                console.log("[SelectorPage] Eager Trigger with:", text)
                stopListening()
                setInterimTranscript('')
                await handleUserMessage(text)
            }

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => {
                setIsListening(false)
                setInterimTranscript('')
                if (eagerTimer) clearTimeout(eagerTimer)

                if (!isMountedRef.current) return
                if (!processingRef.current && !isPlayingAudioRef.current) {
                    try { recognition.start() } catch (e) { /* ignore */ }
                }
            }
            recognition.onresult = async (event: any) => {
                const current = event.resultIndex
                const transcriptText = event.results[current][0].transcript
                const isFinal = event.results[current].isFinal

                setInterimTranscript(transcriptText)

                // Count words
                const wordCount = transcriptText.trim().split(/\s+/).filter((w: string) => w.length > 0).length

                // Reset timer on every result
                if (eagerTimer) clearTimeout(eagerTimer)

                // EAGER TRIGGER logic: Trigger if >= 3 words
                if (wordCount >= 3) {
                    triggerEagerly(transcriptText)
                    return
                }

                // If user stops talking (isFinal), trigger immediately
                if (isFinal) {
                    if (transcriptText.trim().length >= 1) {
                        triggerEagerly(transcriptText)
                    } else {
                        setIsProcessingAI(false)
                    }
                    return
                }

                // Otherwise, wait 3s for silence
                if (transcriptText.trim().length > 0) {
                    eagerTimer = setTimeout(() => {
                        if (!processingRef.current && transcriptText.trim().length > 0) {
                            console.log("[SelectorPage] 3s silence trigger with:", transcriptText)
                            triggerEagerly(transcriptText)
                        }
                    }, 3000)
                }

                // Thinking indicator
                if (transcriptText.length > 1) {
                    setIsProcessingAI(true)
                }
            }

            recognitionRef.current = recognition
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.start() } catch (e) { /* already started */ }
        }
    }

    // Speak Safe
    const speak = async (text: string, langCode: string = 'en', onEnded?: () => void) => {
        isPlayingAudioRef.current = true // Lock logic BEFORE stopping mic to prevent race condition
        stopListening()

        let hasFinished = false
        const finish = () => {
            if (hasFinished) return
            hasFinished = true
            isPlayingAudioRef.current = false
            if (onEnded) onEnded()
            else startListening()
        }

        const timer = setTimeout(() => {
            console.warn(`SelectorPage: TTS Timeout fallback for text: "${text.substring(0, 30)}..." [${langCode}]`)
            finish()
        }, 8000)
        ttsTimerRef.current = timer

        try {
            const url = await getVoiceAudioUrl({
                text,
                textId: `selector_${Date.now()}`,
                version: 'v1',
                langCode
            })
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            const audio = new Audio(url)
            audioRef.current = audio

            audio.onended = () => {
                clearTimeout(timer)
                finish()
            }
            audio.onerror = () => {
                clearTimeout(timer)
                finish()
            }
            await audio.play()
        } catch (error) {
            if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
            finish()
        }
    }

    const handleUserMessage = async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, userMsg])
        await detectLanguageIntent(text)
    }

    const detectLanguageIntent = async (text: string) => {
        processingRef.current = true
        setIsProcessingAI(true)

        try {
            const prompt = `
                Analyze the user's spoken text: "${text}".
                Determine the intended language among: VN, EN, JP, KR, CN.
                - If the text is clearly English (e.g., "I want", "Hello"), output {"code": "EN"}.
                - If the text is clearly Vietnamese, output {"code": "VN"}.
                - If the text is Vietnamese but they said "Tiếng Anh", output {"code": "EN"}. Same for other cases.
                - If the input is nonsensical, completely ambiguous, or in a language NOT listed above, output {"code": "NO"}.
                Output ONLY valid JSON: {"code": "CODE"}
            `

            const responseText = await generateAIResponse(prompt)

            // Parse result
            const jsonMatch = responseText.match(/\{.*?\}/)
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0])
                const code = data.code?.toUpperCase()

                if (code === 'NO') {
                    // Logic for "I don't understand"
                    const errorMsg: Message = {
                        id: Date.now().toString(),
                        role: 'ai',
                        text: "I didn't quite catch that. Please select a language or try again.",
                        timestamp: Date.now()
                    }
                    setMessages(prev => [...prev, errorMsg])
                    await speak("I didn't quite catch that. Please try again.", 'en')

                    setIsProcessingAI(false)
                    processingRef.current = false
                    setInterimTranscript("")
                    return
                }

                if (code && LANGUAGES.find(l => l.code === code.toLowerCase())) {
                    onLanguageSelect(code.toLowerCase())
                    return
                }
            }

            // Default fallback if parsing fails or something goes wrong
            onLanguageSelect('vn')

        } catch (error) {
            console.error("AI Error", error)
            onLanguageSelect('vn')
        }
    }

    // Direct click handler
    const handleFlagClick = (code: string) => {
        setIsProcessingAI(false)
        stopListening()
        onLanguageSelect(code)
    }

    return (
        <HomeLayout>
            <Header />

            <div className="flex-1 relative flex flex-col px-12 pt-12 pb-20 overflow-hidden">
                {/* 1. TOP SECTION: Premium Language Selection (Balanced 5 columns) */}
                <div className="z-20 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h3 className="text-3xl font-bold text-white/50 tracking-[0.2em] uppercase">
                            Please select the language
                        </h3>
                    </motion.div>

                    <div className="grid grid-cols-5 gap-[15px]">
                        {LANGUAGES.map((lang, index) => (
                            <motion.button
                                key={lang.code}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    borderColor: "rgba(255,255,255,0.4)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleFlagClick(lang.code)}
                                className="glass-dark flex flex-col items-center justify-center p-6 gap-6 rounded-[2.5rem] border-2 border-white/10 transition-all duration-300 shadow-2xl group relative overflow-hidden aspect-[2/3] w-full"
                            >
                                {/* Decorative Glow */}
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 blur-3xl rounded-full" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-center w-[120px] h-[120px]">
                                        <span
                                            className={`fi fi-${lang.countryCode} text-[90px] rounded-xl shadow-xl transition-all duration-500 group-hover:scale-110`}
                                            style={{ borderRadius: '0.75rem' }}
                                        />
                                    </div>
                                    {/* Reflection Effect */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-white/10 blur-xl rounded-full opacity-30" />
                                </div>

                                <span className="text-2xl font-bold text-white relative z-10 group-hover:text-glow transition-all tracking-wide text-center">
                                    {lang.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* 2. MIDDLE: Chat Interface (Darker glass effect) */}
                <div className="flex-1 flex flex-col relative z-10 mb-8 min-h-0">
                    <ChatList
                        messages={messages}
                        isThinking={isProcessingAI}
                        interimTranscript={interimTranscript}
                    />
                </div>

                {/* 3. BOTTOM: Voice Controls */}
                <div className="z-20">
                    <VoiceControls
                        isListening={isListening}
                        onToggle={startListening}
                    />
                </div>
            </div>
        </HomeLayout>
    )
}


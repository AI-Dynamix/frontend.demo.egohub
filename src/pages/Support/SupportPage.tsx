import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from '@phosphor-icons/react'
import { Header } from '../../components/kiosk'
import ChatList from '../../components/features/chat/ChatList'
import VoiceControls from '../../components/features/chat/VoiceControls'
import { getVoiceAudioUrl } from '../../services/TTSService'
import type { Message } from '../../components/features/chat/ChatMessage'
import { generateAIResponse } from '../../services/AIService'

// --- Configuration ---

export default function SupportPage() {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const currentLang = i18n.language || 'vn'

    // --- State ---
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessingAI, setIsProcessingAI] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')

    // --- Refs (Robust Logic from SelectorPage) ---
    const recognitionRef = useRef<any>(null)
    const processingRef = useRef(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isPlayingAudioRef = useRef(false)
    const isMountedRef = useRef(true)

    // --- Effects ---

    // 1. Initial Greeting & Cleanup
    useEffect(() => {
        const greetingText = t('support.greeting', "Tôi có thể giúp gì cho bạn?")
        const initialMsg: Message = {
            id: 'init-support',
            role: 'ai',
            text: greetingText,
            timestamp: Date.now()
        }
        setMessages([initialMsg])
        const timer = setTimeout(() => {
            if (isMountedRef.current) {
                console.log("[SupportPage] Triggering initial greeting...")
                speak(greetingText, currentLang)
            }
        }, 500)

        return () => {
            clearTimeout(timer)
            // CRITICAL CLEANUP
            isMountedRef.current = false
            if (recognitionRef.current) {
                recognitionRef.current.abort()
                recognitionRef.current = null
            }
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            setIsListening(false)
        }
    }, [])

    // --- Functions ---

    const stopListening = () => {
        if (recognitionRef.current) {
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
            console.log("[SupportPage] Initializing new SpeechRecognition object")
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true

            // Map i18n lang code to BCP-47 tag for speech recognition
            let langTag = 'vi-VN'
            if (currentLang === 'en') langTag = 'en-US'
            else if (currentLang === 'jp') langTag = 'ja-JP'
            else if (currentLang === 'kr') langTag = 'ko-KR'
            else if (currentLang === 'cn') langTag = 'zh-CN'
            recognition.lang = langTag

            let eagerTimer: ReturnType<typeof setTimeout> | null = null

            const triggerEagerly = async (text: string) => {
                if (processingRef.current) return
                processingRef.current = true
                if (eagerTimer) clearTimeout(eagerTimer)

                console.log("[SupportPage] Eager Trigger with:", text)
                stopListening()
                setInterimTranscript('')
                await handleUserRequest(text)
            }

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => {
                setIsListening(false)
                setInterimTranscript('')
                if (eagerTimer) clearTimeout(eagerTimer)

                if (!isMountedRef.current) return
                // Robust restart: only if not busy
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

                // 1. EAGER TRIGGER logic: Trigger if >= 3 words
                if (wordCount >= 3) {
                    triggerEagerly(transcriptText)
                    return
                }

                // 2. If user definitely finished (isFinal), trigger immediately
                if (isFinal) {
                    if (transcriptText.trim().length >= 1) {
                        triggerEagerly(transcriptText)
                    } else {
                        setIsProcessingAI(false)
                    }
                    return
                }

                // 3. Otherwise, wait 3s for silence
                if (transcriptText.trim().length > 0) {
                    eagerTimer = setTimeout(() => {
                        if (!processingRef.current && transcriptText.trim().length > 0) {
                            console.log("[SupportPage] 3s silence trigger with:", transcriptText)
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

    // Reference Timeout for TTS
    const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const speak = async (text: string, langCode: string, onEnded?: () => void) => {
        isPlayingAudioRef.current = true // Lock BEFORE stopping mic
        stopListening()

        let hasFinished = false
        const finish = () => {
            if (hasFinished || !isMountedRef.current) return
            hasFinished = true
            isPlayingAudioRef.current = false
            processingRef.current = false // Ensure unlocked

            if (onEnded) {
                onEnded()
            } else {
                console.log("[SupportPage] Speech finished, auto-starting mic...")
                // small delay for transition
                setTimeout(() => startListening(), 400)
            }
        }

        // 8s Safety Timeout
        if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
        ttsTimerRef.current = setTimeout(() => {
            console.warn(`[SupportPage] TTS Timeout fallback for: "${text.substring(0, 30)}..."`)
            finish()
        }, 8000)

        try {
            const url = await getVoiceAudioUrl(text, langCode)
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            const audio = new Audio(url)
            audioRef.current = audio

            audio.onended = () => {
                if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
                finish()
            }
            audio.onerror = () => {
                if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
                finish()
            }
            await audio.play()
        } catch (error) {
            console.error("[SupportPage] Audio Play Error:", error)
            if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
            finish()
        }
    }

    const handleUserRequest = async (text: string) => {
        // Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, userMsg])
        setIsProcessingAI(true)

        try {
            const prompt = `
                Role: You are a helpful AI Guide for a Tourism Kiosk.
                Current Language: ${currentLang}.
                User Request: "${text}".
                Requirement: helpful, empathetic, concise (max 2 sentences).
                Output JSON format: { "response": "string", "emotion": "neutral" }
            `

            const responseText = await generateAIResponse(prompt)
            let aiResponseText = ""


            const jsonMatch = responseText.match(/\{.*?\}/s)
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0])
                aiResponseText = data.response || "I am listening."
            } else {
                aiResponseText = responseText // Fallback
            }

            // Display AI Message
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: aiResponseText,
                timestamp: Date.now()
            }
            setMessages(prev => [...prev, aiMsg])

            // Speak it
            // Reset processingRef logic: We want to listen again after speaking.
            // But speak() sets isPlayingAudioRef = true, so startListening() will wait.
            // We can safely release processingRef here because speak() strictly locks isPlayingAudioRef.
            processingRef.current = false
            setIsProcessingAI(false)

            speak(aiResponseText, currentLang)

        } catch (error) {
            console.error("Support AI Error", error)
            processingRef.current = false
            setIsProcessingAI(false)
            startListening() // fallback restart
        }
    }

    const handleBack = () => {
        navigate('/home')
    }

    const handleManualMicToggle = () => {
        if (isListening) {
            stopListening()
        } else {
            // FORCE START: Interrupt audio/processing if user interaction
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            isPlayingAudioRef.current = false
            processingRef.current = false
            startListening()
        }
    }

    return (
        <>
            <Header />

            <div className="flex-1 relative flex flex-col px-8 pb-12 overflow-hidden">
                {/* Top Nav: Back Button */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="my-8 z-20 flex items-center shrink-0"
                >
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-md transition-all active:scale-95 border border-white/10"
                    >
                        <ArrowLeft size={32} className="text-white" />
                        <span className="text-white text-2xl font-bold">{t('common.back', 'Quay lại')}</span>
                    </button>
                    <h2 className="ml-10 text-4xl font-extrabold text-white tracking-tight">{t('support.title')}</h2>
                </motion.div>

                {/* Chat Interface */}
                <ChatList
                    messages={messages}
                    isThinking={isProcessingAI}
                    interimTranscript={interimTranscript}
                />

                {/* Voice Controls */}
                <VoiceControls
                    isListening={isListening}
                    onToggle={handleManualMicToggle}
                />
            </div>
        </>
    )
}

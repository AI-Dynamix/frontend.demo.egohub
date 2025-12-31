import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microphone, Sparkle } from '@phosphor-icons/react'
import { GoogleGenAI } from "@google/genai"
import { getVoiceAudioUrl } from '../services/TTSService'
import { Header } from './kiosk'

// --- Configuration ---
const GEMINI_API_KEY = "AIzaSyCCrZB-gOPwhtz3j2vKanMQlUaGzpwczvA"
const LANGUAGES = [
    { code: 'vn', label: 'Tiếng Việt', greeting: 'Xin chào', welcome: 'Chào mừng bạn đến với Trợ lý du lịch.', flag: '🇻🇳' },
    { code: 'en', label: 'English', greeting: 'Hello', welcome: 'Welcome to the Travel Assistant.', flag: '🇬🇧' },
    { code: 'jp', label: '日本語', greeting: 'Konnichiwa', welcome: 'Ryokō ashisutanto e yōkoso.', flag: '🇯🇵' },
    { code: 'kr', label: '한국어', greeting: 'Annyeonghaseyo', welcome: 'Yeohaeng biseoe osin geoseul hwanyeonghamnida.', flag: '🇰🇷' },
    { code: 'cn', label: '中文', greeting: 'Ni Hao', welcome: 'Huānyíng lái dào lǚyóu zhùlǐ.', flag: '🇨🇳' },
]

// Initialize the new GoogleGenAI client (v0.1.0+)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface GreetingFlowProps {
    onLanguageSelect: (lang: string) => void
}

type Message = {
    id: string
    role: 'user' | 'ai'
    text: string
    timestamp: number
}

const GreetingFlow: React.FC<GreetingFlowProps> = ({ onLanguageSelect }) => {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessingAI, setIsProcessingAI] = useState(false)
    const [selectedLang, setSelectedLang] = useState<string | null>(null)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')

    // --- Refs ---
    const recognitionRef = useRef<any>(null)
    const processingRef = useRef(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // --- Effects ---

    // 1. Initial Greeting
    useEffect(() => {
        const initialMsg: Message = {
            id: 'init-1',
            role: 'ai',
            text: "Hello! I can speak multiple languages. Please say something or choose a language above.",
            timestamp: Date.now()
        }
        setMessages([initialMsg])
        speak(initialMsg.text, 'en', undefined, 'greeting_initial')
    }, [])

    // 2. Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    // --- Functions ---

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
            setIsListening(false)
        }
    }

    const startListening = () => {
        if (processingRef.current || selectedLang || isPlayingAudio) return

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition && !recognitionRef.current) {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            // Listen in Vietnamese by default to capture tonal languages better, 
            // but detection works for others too.
            recognition.lang = 'vi-VN'

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => {
                setIsListening(false)
                setInterimTranscript('')
                // Auto restart if not busy
                if (!processingRef.current && !selectedLang && !isPlayingAudio) {
                    try { recognition.start() } catch (e) { /* ignore */ }
                }
            }
            recognition.onresult = async (event: any) => {
                const current = event.resultIndex
                const transcriptText = event.results[current][0].transcript
                const isFinal = event.results[current].isFinal

                if (isFinal) {
                    if (transcriptText.trim().length > 1) {
                        setInterimTranscript('')
                        stopListening()
                        await handleUserMessage(transcriptText)
                    }
                } else {
                    setInterimTranscript(transcriptText)
                }
            }

            recognitionRef.current = recognition
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.start() } catch (e) { /* already started */ }
        }
    }

    // New Speak Function using Azure service with Safety Timeout
    const speak = async (text: string, langCode: string = 'en', onEnded?: () => void, manualTextId?: string) => {
        stopListening()
        setIsPlayingAudio(true)

        let hasNavigated = false
        const safeNavigate = () => {
            if (hasNavigated) return
            hasNavigated = true
            setIsPlayingAudio(false)
            if (onEnded) onEnded()
            else startListening()
        }

        // 1. Safety Timeout (8s max for TTS generation + playback start)
        const timer = setTimeout(() => {
            console.warn("TTS/Audio Timeout - forcing fallback")
            safeNavigate()
        }, 8000)

        // Generate ID: Use manual ID if provided (for static content), otherwise hash text
        // Simple hash for dynamic text to ensure identical text gets identical cache key
        const textHash = manualTextId || `dynamic_${text.substring(0, 16).replace(/\s+/g, '_')}_${text.length}`

        try {
            // 2. Get Audio
            const url = await getVoiceAudioUrl({
                text,
                textId: textHash,
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
                safeNavigate()
            }

            audio.onerror = (e) => {
                console.error("Audio error", e)
                clearTimeout(timer)
                safeNavigate()
            }

            await audio.play()

        } catch (error) {
            console.error("TTS Error", error)
            clearTimeout(timer)
            safeNavigate()
        }
    }

    const handleUserMessage = async (text: string) => {
        // 1. Add User Message to Chat
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, userMsg])

        // 2. Process with AI
        await detectLanguageIntent(text)
    }

    const detectLanguageIntent = async (text: string) => {
        processingRef.current = true
        setIsProcessingAI(true)

        try {
            // Updated Prompt
            const prompt = 'User said: "' + text + '". Determine the language intent specifically for selecting a language option base on language they said or what they want. Available codes: VN (Vietnamese), EN (English), JP (Japanese), KR (Korean), CN (Chinese). If the user is speaking one of these languages or asking to switch to them, return JSON key "code". If unclear or unrelated, return "NO". Output ONLY JSON: {"code": "VN" | "EN" | "JP" | "KR" | "CN"} or "NO".'
            console.log("Detecting context prompt:", prompt)

            // NEW SDK Call
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [{ text: prompt }],
            });

            // Note: response.text is a getter or property in new SDK
            const responseText = response.text ? response.text.toString().trim() : ""
            console.log("Gemini 2.0 Response:", responseText)

            if (responseText.includes("NO") || !responseText) {
                processingRef.current = false
                setIsProcessingAI(false)

                const replyMsg: Message = {
                    id: Date.now().toString(),
                    role: 'ai',
                    text: "Sorry, I didn't quite catch that. Could you repeat the language?",
                    timestamp: Date.now()
                }
                setMessages(prev => [...prev, replyMsg])
                await speak("Sorry, I didn't quite catch that.", 'en')

            } else {
                const jsonMatch = responseText.match(/\{.*?\}/)
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0])
                    const code = data.code?.toLowerCase()
                    if (code && LANGUAGES.find(l => l.code === code)) {
                        handleLanguageSelect(code)
                    } else {
                        // Valid JSON but invalid code
                        processingRef.current = false
                        setIsProcessingAI(false)
                        const replyMsg: Message = {
                            id: Date.now().toString(),
                            role: 'ai',
                            text: "I'm not sure which language that is. Please try again.",
                            timestamp: Date.now()
                        }
                        setMessages(prev => [...prev, replyMsg])
                        await speak("I'm not sure which language that is.", 'en')
                    }
                } else {
                    // Parse fail
                    processingRef.current = false
                    setIsProcessingAI(false)
                    await speak("Sorry, please try again.", 'en')
                }
            }

        } catch (error) {
            console.error("Gemini Error:", error)
            processingRef.current = false
            setIsProcessingAI(false)

            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'ai',
                text: "My AI connection is a bit unstable. Please tap a language above.",
                timestamp: Date.now()
            }
            setMessages(prev => [...prev, errorMsg])
            startListening()
        }
    }



    const handleLanguageSelect = (code: string) => {
        if (selectedLang) return
        setSelectedLang(code)

        // Reset AI/Mic state
        processingRef.current = false
        setIsProcessingAI(false)
        stopListening()

        const langConfig = LANGUAGES.find(l => l.code === code)
        if (!langConfig) return

        // Add final confirmation message
        const confirmMsg: Message = {
            id: Date.now().toString(),
            role: 'ai',
            text: langConfig.welcome,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, confirmMsg])

        // Speak then switch
        // Use the specific welcome message
        speak(langConfig.welcome, code, () => {
            // THIS CALLBACK handles the navigation after audio ends
            console.log("Audio finished, navigating to home...")
            onLanguageSelect(code)
        }, `greeting_welcome_${code}`)
    }

    // NO KioskLayout wrapper - RootLayout already provides it
    return (
        <div className="h-full flex flex-col bg-black/80 backdrop-blur-xl transition-all duration-1000">
            {/* Header (Consistent with Home) */}
            <Header />

            <div className="flex-1 relative flex flex-col px-8 pb-12 overflow-hidden">

                {/* 1. TOP BAR: Language Selector */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center gap-6 mt-8 mb-6 z-20 shrink-0"
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            disabled={!!selectedLang}
                            className={`flex flex-col items-center gap-4 p-8 rounded-3xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 border-2
                                ${selectedLang === lang.code
                                    ? 'bg-blue-500/80 border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.6)] scale-110'
                                    : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
                        >
                            <span className="text-6xl filter drop-shadow-xl">{lang.flag}</span>
                            <span className="text-white font-semibold tracking-wide text-xl">{lang.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* 2. MIDDLE: Chat Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-grow w-full max-w-4xl mx-auto overflow-y-auto no-scrollbar space-y-6 px-4 pb-48 mask-image-gradient"
                >
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                layout
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] px-8 py-6 rounded-[2rem] backdrop-blur-md shadow-lg text-2xl leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20'
                                        : 'bg-white/10 text-white border border-white/10 rounded-tl-none'}`}
                                >
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 opacity-80">
                                            <Sparkle weight="fill" className="text-purple-300" size={24} />
                                            <span className="text-sm font-bold uppercase tracking-wider text-purple-200">AI Assistant</span>
                                        </div>
                                    )}
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}

                        {/* Interim Transcript (Real-time feedback) */}
                        {interimTranscript && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key="interim"
                                className="flex justify-end"
                            >
                                <div className="max-w-[85%] px-8 py-6 rounded-[2rem] rounded-tr-none bg-blue-500/30 text-white/90 text-2xl border border-white/10 italic animate-pulse">
                                    {interimTranscript}
                                </div>
                            </motion.div>
                        )}

                        {/* Thinking Indicator */}
                        {isProcessingAI && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white/5 border border-white/5 px-8 py-6 rounded-[2rem] rounded-tl-none flex items-center gap-4">
                                    <div className="flex gap-2 h-4 items-center">
                                        <motion.div animate={{ height: [6, 18, 6] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 bg-purple-400/50 rounded-full" />
                                        <motion.div animate={{ height: [6, 18, 6] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 bg-purple-400/50 rounded-full" />
                                        <motion.div animate={{ height: [6, 18, 6] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 bg-purple-400/50 rounded-full" />
                                    </div>
                                    <span className="text-xl text-purple-200/70 ml-2">Evaluating...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. BOTTOM: Mic Status */}
                <div className="absolute bottom-16 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <motion.div
                        animate={{
                            scale: isListening ? 1.05 : 1,
                            borderColor: isListening ? 'rgba(248, 113, 113, 0.6)' : 'rgba(255,255,255,0.1)'
                        }}
                        className="flex items-center gap-6 bg-black/80 backdrop-blur-2xl px-12 py-6 rounded-full border border-white/10 shadow-2xl pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors"
                        onClick={startListening}
                    >
                        <div className={`p-4 rounded-full transition-colors duration-300 
                                ${isListening ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white'}`}
                        >
                            <Microphone size={40} weight={isListening ? "fill" : "duotone"} />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xl tracking-wide">
                                {isListening ? "Listening..." : "Microphone Paused"}
                            </span>
                            <span className="text-base text-white/50">
                                {isListening ? "Say your language..." : "Tap to speak"}
                            </span>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    )
}

export default GreetingFlow

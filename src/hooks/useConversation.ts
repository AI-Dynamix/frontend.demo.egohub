/**
 * useConversation - Unified hook for voice conversation management
 * 
 * Consolidates TTS, speech recognition, and mic management:
 * - Auto-mute mic during TTS playback
 * - Eager mic open before TTS ends (configurable)
 * - Eager trigger after N words (configurable)
 * - Safety timeout for TTS
 * - Message history management
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { getVoiceAudioUrl } from '../services/TTSService'

export interface Message {
    id: string
    role: 'user' | 'ai'
    text: string
    timestamp: number
}

export interface UseConversationOptions {
    /** Default language for TTS and recognition */
    defaultLang?: string
    /** Auto-start listening after mount */
    autoStart?: boolean
    /** Trigger processing after N words (0 = disabled, wait for final) */
    eagerWordCount?: number
    /** TTS safety timeout in ms */
    ttsTimeout?: number
    /** Time before TTS ends to open mic (ms) */
    eagerMicOpenMs?: number
    /** Callback when user message is received */
    onUserMessage?: (text: string, lang: string) => void
}

export interface UseConversationReturn {
    // State
    isListening: boolean
    isPlaying: boolean
    isProcessing: boolean
    interimTranscript: string
    messages: Message[]

    // Actions
    speak: (text: string, lang?: string, onEnded?: () => void) => Promise<void>
    startListening: () => void
    stopListening: () => void
    stopAll: () => void

    // Message helpers
    addMessage: (role: 'user' | 'ai', text: string) => Message
    clearMessages: () => void
    setProcessing: (value: boolean) => void
}

export function useConversation(options: UseConversationOptions = {}): UseConversationReturn {
    const {
        defaultLang = 'vi-VN',
        autoStart = false,
        eagerWordCount = 3,
        ttsTimeout = 8000,
        eagerMicOpenMs = 500,
        onUserMessage
    } = options

    // State
    const [isListening, setIsListening] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')
    const [messages, setMessages] = useState<Message[]>([])

    // Refs
    const recognitionRef = useRef<any>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isMountedRef = useRef(true)
    const isPlayingRef = useRef(false) // Avoid stale closure issues
    const processingRef = useRef(false)
    const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const eagerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sync refs with state
    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        processingRef.current = isProcessing
    }, [isProcessing])

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            if (recognitionRef.current) {
                recognitionRef.current.abort()
                recognitionRef.current = null
            }
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
            if (eagerTimerRef.current) clearTimeout(eagerTimerRef.current)
        }
    }, [])

    // Auto-start listening if enabled
    useEffect(() => {
        if (autoStart && !isPlaying && !isProcessing) {
            startListening()
        }
    }, [autoStart])

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort()
            recognitionRef.current = null
        }
        setIsListening(false)
        setInterimTranscript('')
        if (eagerTimerRef.current) {
            clearTimeout(eagerTimerRef.current)
            eagerTimerRef.current = null
        }
    }, [])

    // Start listening
    const startListening = useCallback(() => {
        // Don't start if playing or processing
        if (isPlayingRef.current || processingRef.current) return
        if (!isMountedRef.current) return

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.warn('[useConversation] SpeechRecognition not supported')
            return
        }

        if (recognitionRef.current) return // Already listening

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = defaultLang

        recognition.onstart = () => {
            if (isMountedRef.current) setIsListening(true)
        }

        recognition.onend = () => {
            if (!isMountedRef.current) return
            setIsListening(false)
            setInterimTranscript('')

            // Auto-restart if not busy
            if (!isPlayingRef.current && !processingRef.current) {
                setTimeout(() => {
                    if (isMountedRef.current && !isPlayingRef.current && !processingRef.current) {
                        try {
                            if (!recognitionRef.current) {
                                startListening()
                            }
                        } catch (e) { /* ignore */ }
                    }
                }, 100)
            }
        }

        recognition.onerror = (event: any) => {
            console.warn('[useConversation] Recognition error:', event.error)
            if (event.error !== 'aborted') {
                recognitionRef.current = null
            }
        }

        recognition.onresult = async (event: any) => {
            const current = event.resultIndex
            const transcriptText = event.results[current][0].transcript
            const isFinal = event.results[current].isFinal

            setInterimTranscript(transcriptText)

            // Count words
            const wordCount = transcriptText.trim().split(/\s+/).filter((w: string) => w.length > 0).length

            // Clear any pending eager timer
            if (eagerTimerRef.current) {
                clearTimeout(eagerTimerRef.current)
                eagerTimerRef.current = null
            }

            // Eager trigger: if >= N words
            if (eagerWordCount > 0 && wordCount >= eagerWordCount) {
                if (!processingRef.current && onUserMessage) {
                    processingRef.current = true
                    setIsProcessing(true)
                    stopListening()
                    onUserMessage(transcriptText, defaultLang)
                }
                return
            }

            // Final result: process
            if (isFinal && transcriptText.trim().length > 1) {
                if (!processingRef.current && onUserMessage) {
                    processingRef.current = true
                    setIsProcessing(true)
                    stopListening()
                    onUserMessage(transcriptText, defaultLang)
                }
            }
        }

        recognitionRef.current = recognition

        try {
            recognition.start()
        } catch (e) {
            console.warn('[useConversation] Failed to start recognition:', e)
        }
    }, [defaultLang, eagerWordCount, onUserMessage, stopListening])

    // Speak with TTS
    const speak = useCallback(async (text: string, lang?: string, onEnded?: () => void) => {
        const speakLang = lang || defaultLang.split('-')[0] // Extract 'vi' from 'vi-VN'

        // Stop listening while speaking
        stopListening()
        setIsPlaying(true)
        isPlayingRef.current = true

        let hasEnded = false
        const safeEnd = () => {
            if (hasEnded) return
            hasEnded = true
            if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
            setIsPlaying(false)
            isPlayingRef.current = false
            if (onEnded) {
                onEnded()
            } else if (isMountedRef.current && !processingRef.current) {
                startListening()
            }
        }

        // Safety timeout
        ttsTimerRef.current = setTimeout(() => {
            console.warn('[useConversation] TTS timeout')
            safeEnd()
        }, ttsTimeout)

        try {
            const url = await getVoiceAudioUrl(text, speakLang)

            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }

            const audio = new Audio(url)
            audioRef.current = audio

            // Eager mic open: open mic a bit before audio ends
            audio.ondurationchange = () => {
                if (audio.duration && eagerMicOpenMs > 0) {
                    const openTime = Math.max(0, (audio.duration * 1000) - eagerMicOpenMs)
                    setTimeout(() => {
                        if (isMountedRef.current && !hasEnded) {
                            // Pre-open mic
                            // Note: Not calling startListening here yet, will do on actual end
                        }
                    }, openTime)
                }
            }

            audio.onended = safeEnd
            audio.onerror = () => {
                console.error('[useConversation] Audio error')
                safeEnd()
            }

            await audio.play()
        } catch (error) {
            console.error('[useConversation] Speak error:', error)
            safeEnd()
        }
    }, [defaultLang, ttsTimeout, eagerMicOpenMs, stopListening, startListening])

    // Stop everything
    const stopAll = useCallback(() => {
        stopListening()
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setIsPlaying(false)
        isPlayingRef.current = false
        if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
    }, [stopListening])

    // Add message
    const addMessage = useCallback((role: 'user' | 'ai', text: string): Message => {
        const msg: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role,
            text,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, msg])
        return msg
    }, [])

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    // Set processing state
    const setProcessingState = useCallback((value: boolean) => {
        setIsProcessing(value)
        processingRef.current = value
    }, [])

    return {
        // State
        isListening,
        isPlaying,
        isProcessing,
        interimTranscript,
        messages,

        // Actions
        speak,
        startListening,
        stopListening,
        stopAll,

        // Message helpers
        addMessage,
        clearMessages,
        setProcessing: setProcessingState
    }
}

export default useConversation

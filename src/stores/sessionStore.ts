import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SupportedLanguage = 'vn' | 'en' | 'cn' | 'jp' | 'kr'

interface SessionState {
    // Session identification
    sessionId: string | null
    sessionStartTime: number | null

    // User state
    isUserDetected: boolean
    selectedLanguage: SupportedLanguage

    // Kiosk state
    isBooted: boolean
    isModelLoaded: boolean

    // Actions
    startSession: () => void
    endSession: () => void
    setUserDetected: (detected: boolean) => void
    setLanguage: (lang: SupportedLanguage) => void
    setBooted: (booted: boolean) => void
    setModelLoaded: (loaded: boolean) => void
    reset: () => void
}

const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const initialState = {
    sessionId: null,
    sessionStartTime: null,
    isUserDetected: false,
    selectedLanguage: 'vn' as SupportedLanguage,
    isBooted: false,
    isModelLoaded: false,
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            ...initialState,

            startSession: () => {
                const sessionId = generateSessionId()
                console.log('[Session] Started:', sessionId)
                set({
                    sessionId,
                    sessionStartTime: Date.now(),
                })
            },

            endSession: () => {
                const { sessionId, sessionStartTime } = get()
                if (sessionId && sessionStartTime) {
                    const duration = Date.now() - sessionStartTime
                    console.log(`[Session] Ended: ${sessionId}, Duration: ${Math.round(duration / 1000)}s`)
                }
                set({
                    sessionId: null,
                    sessionStartTime: null,
                    isUserDetected: false,
                })
            },

            setUserDetected: (detected) => {
                set({ isUserDetected: detected })
            },

            setLanguage: (lang) => {
                console.log('[Session] Language changed to:', lang)
                set({ selectedLanguage: lang })
            },

            setBooted: (booted) => {
                set({ isBooted: booted })
            },

            setModelLoaded: (loaded) => {
                set({ isModelLoaded: loaded })
            },

            reset: () => {
                console.log('[Session] Full reset')
                set(initialState)
            },
        }),
        {
            name: 'ego-kiosk-session',
            partialize: (state) => ({
                // Only persist language preference, not session data
                selectedLanguage: state.selectedLanguage,
            }),
        }
    )
)

// Selector hooks for optimized re-renders
export const useIsBooted = () => useSessionStore((state) => state.isBooted)
export const useIsModelLoaded = () => useSessionStore((state) => state.isModelLoaded)
export const useIsUserDetected = () => useSessionStore((state) => state.isUserDetected)
export const useSelectedLanguage = () => useSessionStore((state) => state.selectedLanguage)

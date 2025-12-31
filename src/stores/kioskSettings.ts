import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface KioskSettings {
    // Engineering Mode Options
    showFloatingEngineerButton: boolean
    autoStartTimeout: number // seconds

    // Feature Toggles
    enableFaceDetection: boolean
    enableIdleTimeout: boolean
    enableSpeechRecognition: boolean
    enableAIChat: boolean

    // Display Options
    showDebugOverlay: boolean
    showCameraPreview: boolean
    theme: 'dark' | 'light' // NEW: Theme setting

    // Face Detection Settings
    welcomeThreshold: number // faceProximity > this -> Show greeting
    transitionThreshold: number // faceProximity > this -> Count to transition

    // System Parameters (Configurable)
    cameraSamplingWelcome: number // ms
    cameraSamplingHome: number // ms
    ttsThrottleDuration: number // ms

    // Actions
    setShowFloatingEngineerButton: (value: boolean) => void
    setAutoStartTimeout: (value: number) => void
    setEnableFaceDetection: (value: boolean) => void
    setEnableIdleTimeout: (value: boolean) => void
    setEnableSpeechRecognition: (value: boolean) => void
    setEnableAIChat: (value: boolean) => void
    setShowDebugOverlay: (value: boolean) => void
    setShowCameraPreview: (value: boolean) => void
    setTheme: (value: 'dark' | 'light') => void // NEW
    setWelcomeThreshold: (value: number) => void
    setTransitionThreshold: (value: number) => void
    setSystemParams: (params: Partial<KioskSettings>) => void
    resetToDefaults: () => void
}

const defaultSettings = {
    showFloatingEngineerButton: true,
    autoStartTimeout: 10,
    enableFaceDetection: true,
    enableIdleTimeout: true,
    enableSpeechRecognition: true,
    enableAIChat: true,
    showDebugOverlay: false,
    showCameraPreview: true,
    theme: 'dark' as const, // NEW: Default dark theme
    welcomeThreshold: 0.2, // > 20% width -> greeting
    transitionThreshold: 0.3, // > 30% width -> transition
    cameraSamplingWelcome: 1000,
    cameraSamplingHome: 10000,
    ttsThrottleDuration: 10000,
}

export const useKioskSettings = create<KioskSettings>()(
    persist(
        (set) => ({
            ...defaultSettings,

            setShowFloatingEngineerButton: (value) => set({ showFloatingEngineerButton: value }),
            setAutoStartTimeout: (value) => set({ autoStartTimeout: value }),
            setEnableFaceDetection: (value) => set({ enableFaceDetection: value }),
            setEnableIdleTimeout: (value) => set({ enableIdleTimeout: value }),
            setEnableSpeechRecognition: (value) => set({ enableSpeechRecognition: value }),
            setEnableAIChat: (value) => set({ enableAIChat: value }),
            setShowDebugOverlay: (value) => set({ showDebugOverlay: value }),
            setShowCameraPreview: (value) => set({ showCameraPreview: value }),
            setTheme: (value) => set({ theme: value }),
            setWelcomeThreshold: (value) => set({ welcomeThreshold: value }),
            setTransitionThreshold: (value) => set({ transitionThreshold: value }),
            setSystemParams: (params) => set((state) => ({ ...state, ...params })),
            resetToDefaults: () => set(defaultSettings),
        }),
        {
            name: 'kiosk-settings',
        }
    )
)

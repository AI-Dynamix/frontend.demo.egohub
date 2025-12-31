import { create } from 'zustand'

interface LogEntry {
    timestamp: number
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    data?: unknown
}

interface DebugState {
    // State
    isEnabled: boolean
    showPanel: boolean
    isSimpleMode: boolean
    logs: LogEntry[]

    // Actions
    toggle: () => void
    setEnabled: (enabled: boolean) => void
    setShowPanel: (show: boolean) => void
    setSimpleMode: (enabled: boolean) => void
    addLog: (level: LogEntry['level'], message: string, data?: unknown) => void
    clearLogs: () => void
}

const MAX_LOGS = 100

export const useDebugStore = create<DebugState>((set) => ({
    isEnabled: import.meta.env.DEV, // Auto-enable in dev mode
    showPanel: false,
    isSimpleMode: localStorage.getItem('kiosk_simple_mode') === 'true',
    logs: [],

    toggle: () => {
        set((state) => ({ showPanel: !state.showPanel }))
    },

    setEnabled: (enabled) => {
        set({ isEnabled: enabled })
    },

    setShowPanel: (show) => {
        set({ showPanel: show })
    },

    setSimpleMode: (enabled) => {
        localStorage.setItem('kiosk_simple_mode', String(enabled))
        set({ isSimpleMode: enabled })
    },

    addLog: (level, message, data) => {
        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            data,
        }
        set((state) => ({
            logs: [...state.logs.slice(-MAX_LOGS + 1), entry],
        }))
    },

    clearLogs: () => {
        set({ logs: [] })
    },
}))

// Helper functions for logging
export const debugLog = {
    info: (message: string, data?: unknown) => {
        if (useDebugStore.getState().isEnabled) {
            console.log(`[DEBUG] ${message}`, data)
            useDebugStore.getState().addLog('info', message, data)
        }
    },
    warn: (message: string, data?: unknown) => {
        if (useDebugStore.getState().isEnabled) {
            console.warn(`[DEBUG] ${message}`, data)
            useDebugStore.getState().addLog('warn', message, data)
        }
    },
    error: (message: string, data?: unknown) => {
        if (useDebugStore.getState().isEnabled) {
            console.error(`[DEBUG] ${message}`, data)
            useDebugStore.getState().addLog('error', message, data)
        }
    },
}

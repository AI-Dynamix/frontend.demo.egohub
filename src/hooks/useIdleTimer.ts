import { useCallback, useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface UseIdleTimerOptions {
    /** Time in ms before showing warning (default: 60000 = 60s) */
    idleTimeout?: number
    /** Time in ms for countdown before reset (default: 10000 = 10s) */
    countdownDuration?: number
    /** Pathname to navigate to when idle (default: '/welcome') */
    redirectPath?: string
    /** Pathnames where idle timer should be disabled */
    disabledPaths?: string[]
    /** Whether the kiosk is booted and timer should be active */
    isActive?: boolean
}

interface UseIdleTimerReturn {
    /** Whether the idle warning modal should be shown */
    showWarning: boolean
    /** Current countdown value in seconds */
    countdown: number
    /** Call this to reset the idle timer (e.g., on user interaction) */
    resetTimer: () => void
    /** Call this to dismiss warning and continue session */
    dismissWarning: () => void
}

export function useIdleTimer({
    idleTimeout = parseInt(import.meta.env.VITE_IDLE_TIMEOUT_MS || '60000'),
    countdownDuration = 10,
    redirectPath = '/welcome',
    disabledPaths = ['/welcome'],
    isActive = true,
}: UseIdleTimerOptions = {}): UseIdleTimerReturn {
    const navigate = useNavigate()
    const location = useLocation()

    const [showWarning, setShowWarning] = useState(false)
    const [countdown, setCountdown] = useState(countdownDuration)

    const idleTimerRef = useRef<number | null>(null)
    const countdownIntervalRef = useRef<number | null>(null)

    const isDisabled = disabledPaths.includes(location.pathname) || !isActive

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current)
            idleTimerRef.current = null
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
        }
    }, [])

    // Reset the idle timer
    const resetTimer = useCallback(() => {
        setShowWarning(false)
        setCountdown(countdownDuration)
        clearTimers()

        if (!isDisabled) {
            idleTimerRef.current = window.setTimeout(() => {
                console.log('[IdleTimer] Warning triggered')
                setShowWarning(true)
            }, idleTimeout)
        }
    }, [isDisabled, idleTimeout, countdownDuration, clearTimers])

    // Dismiss warning and continue
    const dismissWarning = useCallback(() => {
        resetTimer()
    }, [resetTimer])

    // Handle countdown when warning is shown
    useEffect(() => {
        if (showWarning) {
            countdownIntervalRef.current = window.setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearTimers()
                        setShowWarning(false)
                        console.log('[IdleTimer] Session timeout, redirecting...')
                        navigate(redirectPath)
                        return countdownDuration
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
            }
        }
    }, [showWarning, countdownDuration, navigate, redirectPath, clearTimers])

    // Reset timer on location change
    useEffect(() => {
        resetTimer()
        return clearTimers
    }, [location.pathname, resetTimer, clearTimers])

    // Global interaction listeners
    useEffect(() => {
        const handleInteraction = () => {
            if (!showWarning) {
                resetTimer()
            }
        }

        window.addEventListener('click', handleInteraction)
        window.addEventListener('touchstart', handleInteraction)
        window.addEventListener('keydown', handleInteraction)

        return () => {
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('touchstart', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }
    }, [resetTimer, showWarning])

    return {
        showWarning,
        countdown,
        resetTimer,
        dismissWarning,
    }
}

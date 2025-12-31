import { useCallback, useRef, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface UseFaceDetectionOptions {
    /** Time in ms before redirecting when face is lost (default: 10000 = 10s) */
    faceTimeout?: number
    /** Pathname to navigate to when face is lost (default: '/welcome') */
    redirectPath?: string
    /** Pathnames where face detection timeout should be active */
    activePaths?: string[]
    /** Callback when face detection status changes */
    onStatusChange?: (detected: boolean) => void
}

interface UseFaceDetectionReturn {
    /** Whether a face is currently detected */
    isDetected: boolean
    /** Handle face detection status change from CameraTracker */
    handleFaceStatusChange: (detected: boolean) => void
    /** Remaining seconds before timeout (null if not counting) */
    timeoutCountdown: number | null
}

export function useFaceDetection({
    faceTimeout = parseInt(import.meta.env.VITE_FACE_TIMEOUT_MS || '10000'),
    redirectPath = '/welcome',
    activePaths = ['/home'],
    onStatusChange,
}: UseFaceDetectionOptions = {}): UseFaceDetectionReturn {
    const navigate = useNavigate()
    const location = useLocation()

    const [isDetected, setIsDetected] = useState(false)
    const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null)

    const faceTimeoutRef = useRef<number | null>(null)
    const prevDetectedRef = useRef<boolean>(false)

    const isActivePath = activePaths.includes(location.pathname)

    // Clear timeout
    const clearFaceTimeout = useCallback(() => {
        if (faceTimeoutRef.current) {
            clearTimeout(faceTimeoutRef.current)
            faceTimeoutRef.current = null
        }
        setTimeoutCountdown(null)
    }, [])

    // Handle face status change
    const handleFaceStatusChange = useCallback((detected: boolean) => {
        // Only act on change
        if (detected === prevDetectedRef.current) return
        prevDetectedRef.current = detected

        setIsDetected(detected)
        onStatusChange?.(detected)

        // Clear existing timeout
        clearFaceTimeout()

        if (detected) {
            // console.log('[FaceDetection] Face detected')
        } else if (isActivePath) {
            // Face lost on active path: start countdown
            // console.log(`[FaceDetection] Face lost. Starting ${faceTimeout / 1000}s countdown...`)
            setTimeoutCountdown(Math.ceil(faceTimeout / 1000))

            faceTimeoutRef.current = window.setTimeout(() => {
                // console.log('[FaceDetection] Timeout reached, redirecting...')
                navigate(redirectPath)
            }, faceTimeout)
        }
    }, [isActivePath, faceTimeout, redirectPath, navigate, clearFaceTimeout, onStatusChange])

    // Countdown effect for UI feedback
    useEffect(() => {
        let interval: number | null = null

        if (timeoutCountdown !== null && timeoutCountdown > 0) {
            interval = window.setInterval(() => {
                setTimeoutCountdown((prev) => {
                    if (prev === null || prev <= 1) {
                        if (interval) clearInterval(interval)
                        return null
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timeoutCountdown])

    // Clean up timeout on location change or unmount
    useEffect(() => {
        if (!isActivePath) {
            clearFaceTimeout()
        }
        return clearFaceTimeout
    }, [location.pathname, isActivePath, clearFaceTimeout])

    return {
        isDetected,
        handleFaceStatusChange,
        timeoutCountdown,
    }
}

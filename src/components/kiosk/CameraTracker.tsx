/**
 * CameraTracker - Face detection with proximity calculation
 * 
 * Uses MediaPipe Face Detector to:
 * - Detect if a face is present
 * - Calculate face proximity from bounding box size (larger = closer)
 * 
 * Proximity is calculated as: boundingBox.width / videoWidth
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

interface CameraTrackerProps {
    onUserDetected: (isDetected: boolean, proximity?: number) => void
    onModelLoaded?: () => void
    isActive: boolean
    showPreview?: boolean
    autoStart?: boolean
    samplingInterval?: number
    className?: string // Allow overriding styles
}

export interface CameraTrackerHandle {
    startCamera: () => Promise<void>
}

const CameraTracker = forwardRef<CameraTrackerHandle, CameraTrackerProps>(({
    onUserDetected,
    onModelLoaded,
    isActive,
    showPreview = false,
    autoStart = false,
    samplingInterval = 0,
    className = ''
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null)
    const requestRef = useRef<number>()
    const lastVideoTime = useRef<number>(-1)
    const [isCameraRunning, setIsCameraRunning] = useState(false)

    // Fix Stale Closure: Keep the latest callback in a ref
    const onUserDetectedRef = useRef(onUserDetected)
    useEffect(() => {
        onUserDetectedRef.current = onUserDetected
    }, [onUserDetected])

    // Initialize MediaPipe Face Detector
    useEffect(() => {
        const initFaceDetector = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                )
                const detector = await FaceDetector.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: "/models/blaze_face_short_range.tflite",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO"
                })
                setFaceDetector(detector)
                console.log("FaceDetector loaded successfully")
                if (onModelLoaded) onModelLoaded()
            } catch (error) {
                console.error("Error loading FaceDetector:", error)
            }
        }
        initFaceDetector()

        return () => {
            faceDetector?.close()
        }
    }, [])

    // Start Camera Stream
    const startCamera = async () => {
        if (isCameraRunning) return
        if (!videoRef.current) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            })

            // Check if component is still mounted
            if (!videoRef.current) {
                stream.getTracks().forEach(track => track.stop())
                return
            }

            videoRef.current.srcObject = stream
            videoRef.current.addEventListener('loadeddata', predictWebcam)
            setIsCameraRunning(true)
            console.log("Camera started successfully")
        } catch (err) {
            console.error("Error accessing webcam:", err)
        }
    }

    // Auto Start Effect
    useEffect(() => {
        if (autoStart) {
            startCamera()
        }
    }, [autoStart])

    useImperativeHandle(ref, () => ({
        startCamera
    }))

    const lastDetectionTimestamp = useRef<number>(0)

    const predictWebcam = () => {
        if (!faceDetector || !videoRef.current) return

        const now = performance.now()
        const interval = samplingInterval || 0

        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            if (isActive) {
                requestRef.current = requestAnimationFrame(predictWebcam)
            }
            return
        }

        if (now - lastDetectionTimestamp.current >= interval) {
            if (lastVideoTime.current !== videoRef.current.currentTime) {
                lastVideoTime.current = videoRef.current.currentTime
                lastDetectionTimestamp.current = now

                const results = faceDetector.detectForVideo(videoRef.current, now)
                const isFaceDetected = results.detections.length > 0

                // Calculate proximity from bounding box
                let proximity = 0
                if (isFaceDetected && results.detections[0].boundingBox) {
                    const bbox = results.detections[0].boundingBox
                    const videoWidth = videoRef.current.videoWidth

                    // Handle both normalized (0-1) and pixel coordinates
                    // If width <= 1, assume normalized. If > 1, assume pixels.
                    proximity = bbox.width <= 1 ? bbox.width : bbox.width / videoWidth

                    // console.log('[CameraTracker] Face proximity:', proximity, 'bbox width:', bbox.width, 'video width:', videoWidth)
                }

                onUserDetectedRef.current(isFaceDetected, proximity)
            }
        }

        if (isActive) {
            requestRef.current = requestAnimationFrame(predictWebcam)
        }
    }

    useEffect(() => {
        if (isActive && isCameraRunning) {
            requestRef.current = requestAnimationFrame(predictWebcam)
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [isActive, isCameraRunning, faceDetector])

    // Default legacy classes for bottom-left corner
    const defaultClasses = `absolute z-50 bottom-4 left-4 transition-all duration-500 overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl ${showPreview ? 'w-64 h-48 opacity-100' : 'w-1 h-1 opacity-0 pointer-events-none'}`

    // If className is provided, use IT as the base, otherwise use defaultClasses
    // This allows complete override if className is passed. 
    // Wait, simpler approach: Append className, but handle conflicts. 
    // If user passes className, assume they want to control layout.
    // Let's use a simple logic: If className is present, use it + basic transitions. 
    // If NOT present, use defaultClasses.

    const containerClasses = className
        ? `transition-all duration-500 overflow-hidden rounded-xl border-white/20 shadow-2xl ${className}`
        : defaultClasses

    return (
        <div className={containerClasses}>
            {showPreview && !className && (
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-green-400 font-mono backdrop-blur-sm z-10">
                    AI VISION ACTIVE_
                </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
    )
})

export default CameraTracker

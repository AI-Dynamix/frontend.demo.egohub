import { useRef, useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { Camera, X, RotateCcw } from "lucide-react"

interface CameraCaptureProps {
    onCapture: (imageUrl: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
    const { t } = useTranslation()
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: false 
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
            setError(null)
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError(t('camera.error') || "Could not access camera. Please allow permission.")
        }
    }, [t])

    const stopCamera = useCallback(() => {
        setStream(prevStream => {
            if (prevStream) {
                prevStream.getTracks().forEach(track => track.stop())
            }
            return null
        })
    }, [])

    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
        }
        return () => {
             // Cleanup on unmount or deps change
             // We use a functional update in stopCamera so it's safe to call here
             setStream(prevStream => {
                if (prevStream) {
                    prevStream.getTracks().forEach(track => track.stop())
                }
                return null
            })
        }
    }, [isOpen, startCamera, stopCamera])

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas")
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext("2d")
            if (ctx) {
                // Flip horizontally if using user-facing camera (optional, but standard for selfie mirrors)
                ctx.translate(canvas.width, 0)
                ctx.scale(-1, 1)
                ctx.drawImage(videoRef.current, 0, 0)
                const imageUrl = canvas.toDataURL("image/png", 1.0)
                onCapture(imageUrl)
                onClose() // Auto close after capture
            }
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-100 dark:bg-gray-800">
                    <h3 className="font-semibold">{t('camera.title') || "Take Photo"}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="text-white text-center p-4">
                            <p className="mb-4">{error}</p>
                            <Button onClick={startCamera} variant="secondary">
                                <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                            </Button>
                        </div>
                    ) : (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-contain transform -scale-x-100" // Mirror effect, using contain to show full sensor
                        />
                    )}
                </div>

                <div className="p-6 flex justify-center bg-gray-100 dark:bg-gray-800">
                    <Button 
                        size="lg" 
                        onClick={handleCapture} 
                        disabled={!!error || !stream}
                        className="rounded-full w-16 h-16 p-0 border-4 border-white shadow-lg bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    >
                         <Camera className="w-8 h-8 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface MicrophoneVisualizerProps {
    isListening: boolean
}

export default function MicrophoneVisualizer({ isListening }: MicrophoneVisualizerProps) {
    const [levels, setLevels] = useState<number[]>(new Array(5).fill(10))
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const animationFrameRef = useRef<number>()

    useEffect(() => {
        if (isListening) {
            startListening()
        } else {
            stopListening()
            setLevels(new Array(5).fill(10)) // Reset to idle
        }
        return () => stopListening()
    }, [isListening])

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            const ctx = new AudioContext()
            audioContextRef.current = ctx

            const analyser = ctx.createAnalyser()
            analyser.fftSize = 32 // Small FFT size for fewer bars
            analyserRef.current = analyser

            const source = ctx.createMediaStreamSource(stream)
            source.connect(analyser)
            sourceRef.current = source

            analyzeAudio()
        } catch (err) {
            console.error("Microphone access denied:", err)
        }
    }

    const stopListening = () => {
        if (sourceRef.current) sourceRef.current.disconnect()
        if (audioContextRef.current) audioContextRef.current.close()
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

        sourceRef.current = null
        audioContextRef.current = null
        streamRef.current = null
    }

    const analyzeAudio = () => {
        if (!analyserRef.current) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const update = () => {
            if (!analyserRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)

            // Pick 5 representative frequency bands (low to high)
            // Indices depend on fftSize=32 -> 16 bins.
            // Let's pick indices: 1, 3, 5, 8, 12 for variety
            const indices = [1, 3, 5, 8, 12]
            const newLevels = indices.map(i => {
                const val = dataArray[i] || 0
                // Scale 0-255 to 10-50 height range
                return Math.max(10, (val / 255) * 50)
            })

            setLevels(newLevels)
            animationFrameRef.current = requestAnimationFrame(update)
        }
        update()
    }

    return (
        <div className="flex items-center gap-1 h-12 items-end">
            {levels.map((height, index) => (
                <motion.div
                    key={index}
                    animate={{ height }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }} // Smooth transition for visualizer
                    className={`w-3 rounded-full ${isListening ? 'bg-blue-400' : 'bg-gray-600'}`}
                />
            ))}
        </div>
    )
}

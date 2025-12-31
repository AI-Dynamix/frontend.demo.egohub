import { motion } from 'framer-motion'
import { Microphone } from '@phosphor-icons/react'

interface VoiceControlsProps {
    isListening: boolean
    onToggle: () => void
}

export default function VoiceControls({ isListening, onToggle }: VoiceControlsProps) {
    return (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <motion.div
                animate={{
                    scale: isListening ? 1.05 : 1,
                    borderColor: isListening ? 'rgba(248, 113, 113, 0.6)' : 'rgba(255,255,255,0.1)'
                }}
                className="flex items-center gap-6 bg-black/80 backdrop-blur-2xl px-12 py-6 rounded-full border border-white/10 shadow-2xl pointer-events-auto cursor-pointer"
                onClick={onToggle}
            >
                <div className={`p-4 rounded-full ${isListening ? 'bg-red-500/20 text-red-500 shadow-glow' : 'bg-white/10 text-white'}`}>
                    <Microphone size={40} weight={isListening ? "fill" : "duotone"} />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-xl">
                        {isListening ? "Listening..." : "Microphone Paused"}
                    </span>
                    {isListening && (
                        <span className="text-white/60 text-xs tracking-wider uppercase animate-pulse">
                            Tap to Pause
                        </span>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

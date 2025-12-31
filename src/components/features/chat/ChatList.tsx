import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage, { type Message } from './ChatMessage'

interface ChatListProps {
    messages: Message[]
    isThinking: boolean
    interimTranscript: string
}

export default function ChatList({ messages, isThinking, interimTranscript }: ChatListProps) {
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages, isThinking, interimTranscript])

    return (
        <div
            ref={chatContainerRef}
            className="flex-grow w-full max-w-7xl mx-auto overflow-y-auto no-scrollbar space-y-10 px-4 pb-48 mask-image-gradient"
        >
            <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {/* Interim Transcript (Real-time user speech) */}
                {interimTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key="interim"
                        className="flex justify-end"
                    >
                        <div className="max-w-[85%] px-12 py-10 rounded-[3rem] rounded-tr-none bg-blue-500/20 text-white/90 text-5xl font-bold border-2 border-blue-400/20 italic animate-pulse backdrop-blur-3xl">
                            {interimTranscript}
                        </div>
                    </motion.div>
                )}

                {/* AI Thinking Indicator (Typing bubble) */}
                {isThinking && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white/10 border border-white/10 px-8 py-6 rounded-[2rem] rounded-tl-none flex items-center gap-2">
                            <span className="w-3 h-3 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-3 h-3 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-3 h-3 bg-white/60 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

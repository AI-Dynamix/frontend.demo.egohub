import { forwardRef } from 'react'
import { motion } from 'framer-motion'

export type Message = {
    id: string
    role: 'user' | 'ai'
    text: string
    timestamp: number
}

interface ChatMessageProps {
    message: Message
}

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ message }, ref) => {
    const isUser = message.role === 'user'

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            layout
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[85%] px-12 py-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl text-5xl font-bold leading-tight border-2
                ${isUser
                    ? 'bg-blue-600/40 text-white rounded-tr-none border-blue-400/30'
                    : 'bg-black/30 text-white border-white/10 rounded-tl-none shadow-black/60'}`}
            >
                {message.text}
            </div>
        </motion.div>
    )
})

ChatMessage.displayName = 'ChatMessage'

export default ChatMessage

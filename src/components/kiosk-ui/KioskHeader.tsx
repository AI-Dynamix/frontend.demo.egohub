import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretLeft } from '@phosphor-icons/react'
import KioskButton from './KioskButton'

interface KioskHeaderProps {
    title: string
    showBack?: boolean
    rightElement?: React.ReactNode
    onHistoryClick?: () => void
    className?: string
}

export default function KioskHeader({
    title,
    showBack = true,
    rightElement,
    onHistoryClick,
    className = ''
}: KioskHeaderProps) {
    const navigate = useNavigate()

    return (
        <header className={`shrink-0 flex items-center gap-4 px-8 pt-6 pb-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-30 ${className}`}>
            {showBack && (
                <motion.button
                    onClick={() => navigate(-1)}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors shadow-lg"
                >
                    <CaretLeft size={32} className="text-white" weight="bold" />
                </motion.button>
            )}

            <h1 className="text-5xl font-black text-white flex-1 drop-shadow-lg tracking-tight uppercase leading-snug">
                {title}
            </h1>

            <div className="flex items-center gap-2">
                {onHistoryClick && (
                    <KioskButton
                        variant="secondary"
                        size="lg"
                        onClick={onHistoryClick}
                        className="!px-6"
                    >
                        Đơn hàng
                    </KioskButton>
                )}
                {rightElement}
            </div>
        </header>
    )
}

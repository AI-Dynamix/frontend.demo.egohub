import { ButtonHTMLAttributes, ElementType } from 'react'
import { motion } from 'framer-motion'
// import { Icon } from '@phosphor-icons/react' // Removed to fix SyntaxError

interface KioskChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean
    label: string
    icon?: ElementType // Changed from Icon to ElementType
    variant?: 'default' | 'filter' // default = solid background, filter = outline style
}

export default function KioskChip({
    active = false,
    label,
    icon: Icon,
    onClick,
    variant = 'default',
    className = ''
}: KioskChipProps) {

    const activeStyles = variant === 'default'
        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30"
        : "bg-white text-slate-900 border-white shadow-lg"

    const inactiveStyles = variant === 'default'
        ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
        : "bg-transparent border-white/20 text-white/70 hover:bg-white/5 hover:border-white/40"

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
            className={`
                h-14 px-6 rounded-xl border flex items-center gap-3 whitespace-nowrap transition-all
                text-lg font-bold
                ${active ? activeStyles : inactiveStyles}
                ${className}
            `}
        >
            {Icon && (
                <Icon
                    size={24}
                    weight={active ? 'fill' : 'regular'}
                    className={active ? 'opacity-100' : 'opacity-70'}
                />
            )}
            <span>{label}</span>
        </motion.button>
    )
}

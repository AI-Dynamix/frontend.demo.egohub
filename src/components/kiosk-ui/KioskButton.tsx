import { ButtonHTMLAttributes, ElementType } from 'react'
import { motion } from 'framer-motion'
// import { Icon } from '@phosphor-icons/react'

interface KioskButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'xl' | 'lg' | 'md'
    icon?: ElementType
    iconPosition?: 'left' | 'right'
    fullWidth?: boolean
}

export default function KioskButton({
    children,
    variant = 'primary',
    size = 'xl',
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    ...props
}: KioskButtonProps) {

    // Design System Styles
    const baseStyles = "rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 border border-blue-400/50",
        secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10",
        outline: "bg-transparent border-2 border-white/20 text-white hover:border-white/50",
        ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
        danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 border border-red-400/50"
    }

    // Updated Sizes for Kiosk (30px unit base)
    const sizes = {
        xl: "h-24 px-10 text-3xl rounded-[2rem]",    // 96px - Main Actions
        lg: "h-20 px-8 text-2xl rounded-[1.8rem]",    // 80px - Secondary Actions
        md: "h-16 px-6 text-xl rounded-2xl"            // 64px - Minor Actions
    }

    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {Icon && iconPosition === 'left' && <Icon weight="fill" className="text-[1.2em]" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon weight="fill" className="text-[1.2em]" />}
        </motion.button>
    )
}

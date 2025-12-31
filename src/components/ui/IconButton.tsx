import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    icon: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'ghost' | 'solid' | 'outline'
    rounded?: boolean
    label?: string // For accessibility
}

const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
}

const iconSizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
}

const variantStyles = {
    ghost: 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white',
    solid: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
    outline: 'bg-transparent border-2 border-white/20 hover:border-white/40 text-white/70 hover:text-white',
}

/**
 * Reusable IconButton component for consistent icon buttons across the app
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
    icon,
    size = 'md',
    variant = 'ghost',
    rounded = true,
    label,
    className = '',
    disabled,
    ...motionProps
}, ref) => {
    const baseStyles = `
        inline-flex items-center justify-center
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
    `

    return (
        <motion.button
            ref={ref}
            className={`${baseStyles} ${className}`}
            whileHover={disabled ? undefined : { scale: 1.1 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            disabled={disabled}
            aria-label={label}
            {...motionProps}
        >
            <span className={iconSizeStyles[size]}>{icon}</span>
        </motion.button>
    )
})

IconButton.displayName = 'IconButton'

export default IconButton

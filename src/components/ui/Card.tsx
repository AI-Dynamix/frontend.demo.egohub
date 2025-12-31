import { type ReactNode, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode
    variant?: 'glass' | 'solid' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const variantStyles = {
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
    solid: 'bg-slate-800 border border-slate-700',
    outline: 'bg-transparent border-2 border-white/20',
}

const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
}

const roundedStyles = {
    sm: 'rounded-lg',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
    full: 'rounded-full',
}

/**
 * Reusable Card component with glass/solid/outline variants
 * Supports motion animations for interactive states
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
    children,
    variant = 'glass',
    size = 'md',
    interactive = false,
    rounded = 'lg',
    className = '',
    ...motionProps
}, ref) => {
    const baseStyles = `${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]}`
    const interactiveStyles = interactive
        ? 'cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98]'
        : ''

    return (
        <motion.div
            ref={ref}
            className={`${baseStyles} ${interactiveStyles} ${className}`}
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            {...motionProps}
        >
            {children}
        </motion.div>
    )
})

Card.displayName = 'Card'

export default Card

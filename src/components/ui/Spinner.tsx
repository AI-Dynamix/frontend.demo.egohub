import { motion } from 'framer-motion'

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    color?: string
    className?: string
}

const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
}

/**
 * Loading spinner with smooth animation
 */
export function Spinner({
    size = 'md',
    color = 'currentColor',
    className = '',
}: SpinnerProps) {
    return (
        <motion.div
            className={`${sizeStyles[size]} ${className}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={color}
                    strokeWidth="3"
                    strokeOpacity="0.2"
                />
                <path
                    d="M12 2C6.47715 2 2 6.47715 2 12"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        </motion.div>
    )
}

export default Spinner

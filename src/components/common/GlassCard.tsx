import { motion, type HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    hoverEffect?: boolean
}

export function GlassCard({
    children,
    className,
    hoverEffect = false,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hoverEffect ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
            className={cn(
                "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 text-white",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    )
}

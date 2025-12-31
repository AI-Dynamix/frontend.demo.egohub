import { motion, type HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper for tailwind class merging
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface KioskButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    icon?: ReactNode
    isActive?: boolean
}

export function KioskButton({
    children,
    className,
    variant = 'glass',
    size = 'md',
    icon,
    isActive = false,
    ...props
}: KioskButtonProps) {

    const variants = {
        primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white",
        ghost: "bg-transparent hover:bg-white/10 text-white border border-transparent hover:border-white/20",
        glass: "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-lg"
    }

    const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-lg gap-2",
        md: "px-6 py-3 text-base rounded-xl gap-3",
        lg: "px-8 py-4 text-lg rounded-2xl gap-4",
        xl: "px-10 py-6 text-xl rounded-3xl gap-5"
    }

    const activeStyles = isActive
        ? "ring-2 ring-emerald-400 border-emerald-500 bg-emerald-500/20"
        : ""

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "flex items-center justify-center transition-all font-semibold select-none",
                variants[variant],
                sizes[size],
                activeStyles,
                className
            )}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </motion.button>
    )
}

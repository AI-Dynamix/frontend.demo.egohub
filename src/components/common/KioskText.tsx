import { createElement, ReactNode } from 'react'

interface KioskTextProps {
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
    children: ReactNode
    className?: string
    gradient?: boolean
}

export function KioskText({
    as = 'p',
    children,
    className = '',
    gradient = false
}: KioskTextProps) {

    const baseStyles = "text-white select-none transition-colors"

    const gradientStyles = gradient
        ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-bold"
        : ""

    const combinedClasses = `${baseStyles} ${gradientStyles} ${className}`

    return createElement(as, { className: combinedClasses }, children)
}

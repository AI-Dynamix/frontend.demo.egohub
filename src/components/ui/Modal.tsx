import { type ReactNode, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'fullscreen'
    showCloseButton?: boolean
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
    className?: string
}

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    fullscreen: 'w-full h-full max-w-none rounded-none',
}

/**
 * Reusable Modal component with animations
 * Renders via React Portal to ensure proper z-index stacking
 */
export function Modal({
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
}: ModalProps) {
    // Handle Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
                onClose()
            }
        },
        [closeOnEscape, onClose]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKeyDown])

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative z-10 w-full mx-4 bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl ${sizeStyles[size]} ${className}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                {title && (
                                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            fill="currentColor"
                                            viewBox="0 0 256 256"
                                        >
                                            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className={title || showCloseButton ? 'p-6' : 'p-6'}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    // Render via portal to document.body
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body)
    }

    return null
}

export default Modal

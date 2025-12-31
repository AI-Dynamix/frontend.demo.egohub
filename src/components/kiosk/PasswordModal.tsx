import { useState } from 'react'
import { motion } from 'framer-motion'
import { LockKey, X, CheckCircle, XCircle } from '@phosphor-icons/react'
import { useAuthStore } from '../../services/authService'

interface PasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function PasswordModal({
    isOpen,
    onClose,
    onSuccess,
}: PasswordModalProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)
    const [success, setSuccess] = useState(false)
    const { authenticate } = useAuthStore()

    const handleSubmit = () => {
        console.log('[PasswordModal] handleSubmit called, password:', password)
        if (authenticate(password)) {
            console.log('[PasswordModal] Password CORRECT via authService')
            setSuccess(true)
            setError(false)
            // Call onSuccess after showing success message
            setTimeout(() => {
                console.log('[PasswordModal] Calling onSuccess')
                setPassword('')
                setSuccess(false)
                onSuccess()
            }, 300)
        } else {
            console.log('[PasswordModal] Password WRONG')
            setError(true)
            setPassword('')
            setTimeout(() => setError(false), 1500)
        }
    }

    const handleNumberClick = (num: string) => {
        if (password.length < 6) {
            setPassword(prev => prev + num)
        }
    }

    const handleClear = () => {
        setPassword('')
        setError(false)
    }

    const handleBackspace = () => {
        setPassword(prev => prev.slice(0, -1))
    }

    const handleClose = () => {
        setPassword('')
        setError(false)
        setSuccess(false)
        onClose()
    }

    // Don't render anything if not open
    if (!isOpen) {
        console.log('[PasswordModal] isOpen is FALSE, returning null')
        return null
    }

    console.log('[PasswordModal] Rendering modal, isOpen:', isOpen)

    return (
        <motion.div
            key="password-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="relative z-10 bg-slate-900/95 border border-white/10 rounded-3xl p-8 w-[400px] shadow-2xl"
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <LockKey size={32} className="text-amber-400" weight="fill" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Engineering Mode</h2>
                    <p className="text-white/50 text-sm mt-2">Enter password to access</p>
                </div>

                {/* Password Display */}
                <div className={`flex justify-center gap-3 mb-6 transition-all ${error ? 'animate-shake' : ''}`}>
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${success
                                ? 'border-emerald-400 bg-emerald-500/20'
                                : error
                                    ? 'border-red-400 bg-red-500/20'
                                    : password[i]
                                        ? 'border-white/40 bg-white/10'
                                        : 'border-white/20 bg-white/5'
                                }`}
                        >
                            {password[i] ? (
                                <span className="text-white">•</span>
                            ) : null}
                        </div>
                    ))}
                </div>

                {/* Status Message */}
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-center gap-2 mb-4 ${success ? 'text-emerald-400' : 'text-red-400'
                            }`}
                    >
                        {success ? (
                            <>
                                <CheckCircle size={20} weight="fill" />
                                <span>Access granted</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={20} weight="fill" />
                                <span>Incorrect password</span>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                if (key === 'C') handleClear()
                                else if (key === '⌫') handleBackspace()
                                else handleNumberClick(key)
                            }}
                            className={`h-14 rounded-xl text-xl font-bold transition-all active:scale-95 ${key === 'C'
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : key === '⌫'
                                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={password.length < 4}
                    className="w-full mt-6 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-white/10 disabled:text-white/30 text-white font-bold text-lg transition-all active:scale-98"
                >
                    Unlock
                </button>
            </motion.div>
        </motion.div>
    )
}

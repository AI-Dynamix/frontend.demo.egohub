import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface IdleWarningModalProps {
    countdown: number
    onDismiss: () => void
}

/**
 * Modal displayed when user is idle for too long
 * Shows countdown and allows user to confirm they're still there
 */
export default function IdleWarningModal({ countdown, onDismiss }: IdleWarningModalProps) {
    const { t } = useTranslation()

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white/10 border border-white/20 p-10 rounded-3xl max-w-lg w-full mx-4 text-center shadow-2xl"
            >
                {/* Icon */}
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        className="text-yellow-400"
                    >
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-white mb-4">
                    {t('idle.warning', 'Bạn còn đang sử dụng không?')}
                </h3>

                {/* Countdown */}
                <div className="text-xl text-gray-300 mb-8">
                    {t('idle.autoReset', { seconds: countdown, defaultValue: `Tự động kết thúc sau ${countdown}s` })}
                </div>

                {/* Countdown Circle */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-white/10"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 44}
                            strokeDashoffset={2 * Math.PI * 44 * (1 - countdown / 10)}
                            strokeLinecap="round"
                            className="text-yellow-400 transition-all duration-1000"
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
                        {countdown}
                    </span>
                </div>

                {/* Action Button */}
                <button
                    onClick={onDismiss}
                    className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all active:scale-95 text-xl shadow-lg"
                >
                    {t('idle.continueButton', 'Tôi vẫn đang sử dụng')}
                </button>
            </motion.div>
        </motion.div>
    )
}

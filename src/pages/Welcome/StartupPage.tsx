/**
 * StartupPage - Màn hình khởi động Kiosk (Boot/Loading Screen)
 * 
 * MỤC ĐÍCH: Hiển thị khi kiosk mới khởi động, load các thư viện AI/ML.
 *           Cung cấp access cho kỹ thuật viên vào Engineering Mode.
 * 
 * FLOW: StartupPage (boot) → AttractionPage (idle) → SelectorPage → Home
 * 
 * TRIGGER: Auto → AttractionPage khi models đã load xong
 */

import { motion } from 'framer-motion'
import { AnimatedLogo } from '../../components/kiosk'
import { GearSix } from '@phosphor-icons/react'

interface StartupPageProps {
    isLoading?: boolean
    loadingProgress?: number
    onEngineeringMode?: () => void
}

export default function StartupPage({ isLoading = true, loadingProgress = 0, onEngineeringMode }: StartupPageProps) {
    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black relative">
            {/* Background animations */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"
            />

            {/* Engineering Mode Button - Top Right */}
            {onEngineeringMode && (
                <motion.button
                    onClick={onEngineeringMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="absolute top-8 right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-20"
                    title="Engineering Mode"
                >
                    <GearSix size={24} className="text-white/40 hover:text-white/70" weight="fill" />
                </motion.button>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                >
                    <AnimatedLogo scale={2} className="drop-shadow-2xl" />
                </motion.div>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 flex flex-col items-center"
                    >
                        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${loadingProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <p className="text-white/40 text-sm mt-4 tracking-widest uppercase">
                            Đang khởi động...
                        </p>
                    </motion.div>
                )}

                {/* AI Powered tag */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-white/30 text-xs tracking-[0.5em] mt-12 uppercase"
                >
                    AI Powered Experience
                </motion.p>
            </div>
        </div>
    )
}

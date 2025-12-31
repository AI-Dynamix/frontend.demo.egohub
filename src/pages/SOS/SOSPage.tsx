/**
 * SOSPage - Màn hình an ninh khẩn cấp
 * - Nút SOS (giữ 3 giây để kích hoạt)
 * - Nút gọi Công An (113)
 * - Nút Cấp cứu (115)
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, Warning, Phone, FirstAid, Siren } from '@phosphor-icons/react'
import HomeLayout from '../../layouts/HomeLayout'

export default function SOSPage() {
    const navigate = useNavigate()
    const [sosProgress, setSosProgress] = useState(0)
    const [sosTriggered, setSosTriggered] = useState(false)
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const SOS_HOLD_DURATION = 3000 // 3 seconds

    const startSOSHold = () => {
        if (sosTriggered) return

        // Start progress animation
        const startTime = Date.now()
        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            const progress = Math.min((elapsed / SOS_HOLD_DURATION) * 100, 100)
            setSosProgress(progress)
        }, 50)

        // Trigger after 3 seconds
        holdTimerRef.current = setTimeout(() => {
            setSosTriggered(true)
            setSosProgress(100)
            clearInterval(progressIntervalRef.current!)
            // Here you would trigger actual SOS alert
            console.log('🚨 SOS TRIGGERED!')
        }, SOS_HOLD_DURATION)
    }

    const cancelSOSHold = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
        }
        if (!sosTriggered) {
            setSosProgress(0)
        }
    }

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        }
    }, [])

    const handleCall = (number: string) => {
        console.log(`📞 Calling ${number}...`)
        // In real app, this would trigger a call or notify staff
        alert(`Đang gọi ${number}...`)
    }

    return (
        <HomeLayout>
            <div className="flex flex-col h-full">
                {/* Header */}
                <header className="h-[calc(6*var(--k-unit))] shrink-0 flex items-center px-8 gap-4 bg-red-900/30">
                    <motion.button
                        onClick={() => navigate(-1)}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <CaretLeft size={32} className="text-white" />
                    </motion.button>
                    <Siren size={40} className="text-red-400" weight="fill" />
                    <h1 className="text-4xl font-black text-white">AN NINH KHẨN CẤP</h1>
                </header>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">

                    {/* SOS Button - Hold to trigger */}
                    <motion.div className="relative">
                        <motion.button
                            onMouseDown={startSOSHold}
                            onMouseUp={cancelSOSHold}
                            onMouseLeave={cancelSOSHold}
                            onTouchStart={startSOSHold}
                            onTouchEnd={cancelSOSHold}
                            disabled={sosTriggered}
                            className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all overflow-hidden ${sosTriggered
                                    ? 'bg-red-600 border-white shadow-[0_0_60px_rgba(239,68,68,0.8)]'
                                    : 'bg-red-600/80 border-red-400 hover:bg-red-600'
                                }`}
                            animate={sosTriggered ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5, repeat: sosTriggered ? Infinity : 0 }}
                        >
                            {/* Progress ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="46"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="4"
                                    strokeDasharray={`${sosProgress * 2.89} 289`}
                                    className="transition-all duration-100"
                                />
                            </svg>

                            <Warning size={80} className="text-white" weight="fill" />
                            <span className="text-4xl font-black text-white">SOS</span>
                            {!sosTriggered && (
                                <span className="text-sm text-white/80 font-medium">GIỮ 3 GIÂY</span>
                            )}
                        </motion.button>

                        {sosTriggered && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-red-400 font-bold text-xl whitespace-nowrap"
                            >
                                🚨 ĐÃ GỬI TÍN HIỆU KHẨN CẤP!
                            </motion.p>
                        )}
                    </motion.div>

                    <div className="h-8" />

                    {/* Emergency Call Buttons */}
                    <div className="w-full max-w-lg flex flex-col gap-4">
                        {/* Police */}
                        <motion.button
                            onClick={() => handleCall('113')}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 flex items-center gap-6 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <Phone size={36} className="text-white" weight="fill" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-3xl font-black text-white">113</p>
                                <p className="text-xl text-white/80">Gọi Công An</p>
                            </div>
                            <Siren size={40} className="text-white/60" />
                        </motion.button>

                        {/* Ambulance */}
                        <motion.button
                            onClick={() => handleCall('115')}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 flex items-center gap-6 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <FirstAid size={36} className="text-white" weight="fill" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-3xl font-black text-white">115</p>
                                <p className="text-xl text-white/80">Cấp Cứu Y Tế</p>
                            </div>
                        </motion.button>

                        {/* Fire */}
                        <motion.button
                            onClick={() => handleCall('114')}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 flex items-center gap-6 transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <Phone size={36} className="text-white" weight="fill" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-3xl font-black text-white">114</p>
                                <p className="text-xl text-white/80">Cứu Hỏa</p>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </HomeLayout>
    )
}

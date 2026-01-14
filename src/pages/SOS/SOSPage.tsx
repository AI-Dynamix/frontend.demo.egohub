/**
 * SOSPage - Màn hình an ninh khẩn cấp
 * - Nút SOS (giữ 3 giây để kích hoạt)
 * - Nút gọi Công An (113)
 * - Nút Cấp cứu (115)
 * - Video Call hỗ trợ trực tuyến (AI Support)
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, Warning, Phone, FirstAid, Siren, VideoCamera, ChatCircleDots } from '@phosphor-icons/react'
import HomeLayout from '../../layouts/HomeLayout'
import VideoCallInterface from './components/VideoCallInterface'

type SOSMode = 'menu' | 'calling' | 'incall'

export default function SOSPage() {
    const navigate = useNavigate()
    const [mode, setMode] = useState<SOSMode>('menu')
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

    const startVideoSupport = () => {
        setMode('calling')
        // Simulate connecting delay
        setTimeout(() => {
            setMode('incall')
        }, 1500)
    }

    // Render Video Call Interface if in 'incall' mode
    if (mode === 'incall') {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                <VideoCallInterface onEndCall={() => setMode('menu')} />
            </div>
        )
    }

    return (
        <HomeLayout>
            <div className="flex flex-col h-full relative">

                {/* Connecting Overlay */}
                <AnimatePresence>
                    {mode === 'calling' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                <div className="w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <VideoCamera size={32} className="text-blue-500" weight="fill" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Đang kết nối tới tổng đài hỗ trợ AI...</h2>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col lg:flex-row items-center justify-center px-8 gap-12 lg:gap-24">

                        {/* LEFT: SOS Button */}
                        <div className="flex flex-col items-center gap-8">
                            <motion.div className="relative">
                                <motion.button
                                    onMouseDown={startSOSHold}
                                    onMouseUp={cancelSOSHold}
                                    onMouseLeave={cancelSOSHold}
                                    onTouchStart={startSOSHold}
                                    onTouchEnd={cancelSOSHold}
                                    disabled={sosTriggered}
                                    className={`relative w-72 h-72 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all overflow-hidden ${sosTriggered
                                        ? 'bg-red-600 border-white shadow-[0_0_80px_rgba(239,68,68,0.8)]'
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
                                    <span className="text-5xl font-black text-white">SOS</span>
                                    {!sosTriggered && (
                                        <span className="text-base text-white/80 font-medium">GIỮ 3 GIÂY</span>
                                    )}
                                </motion.button>

                                {sosTriggered && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-red-400 font-bold text-2xl whitespace-nowrap"
                                    >
                                        🚨 ĐÃ GỬI TÍN HIỆU!
                                    </motion.p>
                                )}
                            </motion.div>
                        </div>

                        {/* RIGHT: Quick Actions */}
                        <div className="w-full max-w-xl flex flex-col gap-5">
                            <h2 className="text-white/60 font-medium uppercase tracking-wider mb-2">Hỗ trợ khẩn cấp</h2>

                            {/* AI Video Support - NEW FEATURE */}
                            <motion.button
                                onClick={startVideoSupport}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-6 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 flex items-center gap-6 transition-all shadow-lg shadow-blue-900/40 border border-blue-400/30"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                    <VideoCamera size={36} className="text-white relative z-10" weight="fill" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-2xl font-black text-white">Hỗ Trợ Trực Tuyến</p>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white">AI SUPPORT</span>
                                    </div>
                                    <p className="text-lg text-blue-100">Video call với trợ lý ảo & phiên dịch viên</p>
                                </div>
                                <ChatCircleDots size={40} className="text-white/60" />
                            </motion.button>

                            <div className="h-4 border-b border-white/10 mb-4"></div>

                            {/* Standard Emergency Numbers */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.button
                                    onClick={() => handleCall('113')}
                                    whileTap={{ scale: 0.98 }}
                                    className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/5 flex flex-col gap-3 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Siren size={28} className="text-blue-400" weight="fill" />
                                        <span className="text-2xl font-bold text-white">113</span>
                                    </div>
                                    <p className="text-left text-white/60">Công An</p>
                                </motion.button>

                                <motion.button
                                    onClick={() => handleCall('115')}
                                    whileTap={{ scale: 0.98 }}
                                    className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/5 flex flex-col gap-3 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FirstAid size={28} className="text-emerald-400" weight="fill" />
                                        <span className="text-2xl font-bold text-white">115</span>
                                    </div>
                                    <p className="text-left text-white/60">Cấp Cứu</p>
                                </motion.button>
                            </div>

                            <motion.button
                                onClick={() => handleCall('114')}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <Phone size={20} className="text-orange-400" weight="fill" />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xl font-bold text-white block">114</span>
                                        <span className="text-sm text-white/60">Cứu Hỏa & Cứu Nạn</span>
                                    </div>
                                </div>
                                <CaretLeft size={20} className="text-white/20 rotate-180" />
                            </motion.button>

                        </div>
                    </div>
                </div>
            </div>
        </HomeLayout>
    )
}


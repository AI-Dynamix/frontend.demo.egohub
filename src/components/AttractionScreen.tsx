import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './kiosk'

const TITLES = [
    { lang: 'en', text: "Smart Tourism Portal", sub: "with AI Concierge" },
    { lang: 'vn', text: "Cổng Thông Tin Du Lịch Thông Minh", sub: "với Trợ Lý AI" },
    { lang: 'jp', text: "スマート観光ポータル", sub: "AIコンシェルジュ付き" },
    { lang: 'kr', text: "스마트 관광 포털", sub: "AI 컨시어지 탑재" },
    { lang: 'cn', text: "智慧旅游门户", sub: "配备 AI 礼宾服务" },
]

export default function AttractionScreen() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % TITLES.length)
        }, 4000) // Change every 4 seconds
        return () => clearInterval(timer)
    }, [])

    // NO KioskLayout wrapper - RootLayout already provides it
    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-black/80">
            {/* Standard Header */}
            <Header />

            {/* Attraction Specific Animations - keeping these as they add "Attraction Mode" flair */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.5, 0.2],
                    x: [0, 100, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"
            />

            {/* Content (Centered Title) */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
                {/* Logo removed here as it is now in Header */}

                <div className="h-48 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <h1 className="text-6xl font-black text-white tracking-wide uppercase mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] max-w-4xl leading-tight">
                                {TITLES[index].text}
                            </h1>

                            <p className="text-3xl text-blue-200 font-light tracking-[0.2em] uppercase">
                                {TITLES[index].sub}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer hint - Optional */}
            <div className="absolute bottom-12 w-full text-center">
                <p className="text-white/30 text-sm tracking-widest">AI POWERED EXPERIENCE</p>
            </div>
        </div>
    )
}

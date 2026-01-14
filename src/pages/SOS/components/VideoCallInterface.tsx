import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Microphone, MicrophoneSlash,
    VideoCamera, VideoCameraSlash,
    PhoneDisconnect,
    Translate,
    Globe
} from '@phosphor-icons/react'
import policeImage from '../../../assets/images/police_female_talking.png'

interface VideoCallInterfaceProps {
    onEndCall: () => void;
}

export default function VideoCallInterface({ onEndCall }: VideoCallInterfaceProps) {
    const [isMuted, setIsMuted] = useState(false)
    const [isCamOff, setIsCamOff] = useState(false)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Simulated AI Translation log
    const [translationLog, setTranslationLog] = useState<{ sender: 'agent' | 'ai', text: string, lang: string }[]>([])
    const [currentLanguage, setCurrentLanguage] = useState('Tiếng Việt')

    // Initialize Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                setLocalStream(stream)
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch (err) {
                console.error("Error accessing camera:", err)
            }
        }

        if (!isCamOff) {
            startCamera()
        } else {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop())
                setLocalStream(null)
            }
        }

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [isCamOff])

    // Simulate AI Translation updates
    useEffect(() => {
        const messages = [
            { sender: 'agent', text: 'Xin chào, tôi là cán bộ Minh. Tôi có thể giúp gì cho bạn?', lang: 'VN' },
            { sender: 'ai', text: 'Hello, I am Officer Minh. How can I assist you?', lang: 'EN' },
            { sender: 'agent', text: 'Bình tĩnh nhé, chúng tôi đã định vị được vị trí của bạn.', lang: 'VN' },
            { sender: 'ai', text: 'Stay calm, we have located your position.', lang: 'EN' },
            { sender: 'agent', text: 'Xe cứu thương đang trên đường tới.', lang: 'VN' },
            { sender: 'ai', text: 'An ambulance is on the way.', lang: 'EN' },
        ] as const;

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < messages.length) {
                const msg = messages[currentIndex];
                setTranslationLog(prev => [...prev.slice(-2), { ...msg, sender: msg.sender as 'agent' | 'ai' }])
                setCurrentLanguage(msg.lang === 'VN' ? 'Tiếng Việt' : 'English')
                currentIndex++
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col overflow-hidden">

            {/* TOP 2/3: VIDEO CALL AREA */}
            <div className="flex-[2] relative bg-black overflow-hidden group">
                {/* Remote Video (Officer Background) */}
                <div className="absolute inset-0">
                    {/* "Friendly Vietnamese Police Officer" */}
                    <img
                        src={policeImage}
                        className="w-full h-full object-cover opacity-80"
                        alt="Police Support"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                {/* Status Bar */}
                <div className="absolute top-8 left-8 flex items-center gap-4">
                    <div className="bg-red-600 animate-pulse px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-red-900/50">
                        <div className="w-3 h-3 rounded-full bg-white" />
                        <span className="text-white font-bold tracking-wider">LIVE SUPPORT</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <Globe size={20} className="text-blue-400" />
                        <span className="text-white font-medium">{currentLanguage}</span>
                    </div>
                </div>

                {/* Local Video Preview (Large PIP) */}
                <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    className="absolute top-8 right-8 w-64 h-80 bg-slate-800 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl z-20"
                >
                    {!isCamOff ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                            <VideoCameraSlash size={48} className="text-white/30" />
                        </div>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/50 px-3 py-1 rounded-full text-white/80 text-sm font-medium">Bạn (You)</span>
                    </div>
                </motion.div>

                {/* Center Info (When simulate connecting or idle) */}
                <div className="absolute bottom-8 left-8 text-white">
                    <h2 className="text-4xl font-bold mb-2 text-shadow-lg">Cán bộ: Nguyễn Văn Minh</h2>
                    <p className="text-xl text-white/80">Công an Phường Bến Nghé, Quận 1</p>
                </div>
            </div>

            {/* BOTTOM 1/3: TRANSLATION & CONTROLS */}
            <div className="flex-1 bg-slate-900 border-t border-white/10 flex flex-col relative z-30">

                {/* Translation Area */}
                <div className="flex-1 p-8 flex flex-col justify-center items-center text-center overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-b-xl" />

                    <AnimatePresence mode="wait">
                        {translationLog.length > 0 && (
                            <motion.div
                                key={translationLog[translationLog.length - 1].text}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl"
                            >
                                <div className="flex justify-center items-center gap-3 mb-4 text-cyan-400">
                                    <Translate size={32} />
                                    <span className="text-xl font-bold uppercase tracking-widest">AI Dịch Thuật</span>
                                </div>
                                <p className="text-4xl md:text-5xl font-medium text-white leading-tight">
                                    "{translationLog[translationLog.length - 1].text}"
                                </p>
                            </motion.div>
                        )}
                        {translationLog.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}>
                                <p className="text-2xl text-white/40 italic">Đang lắng nghe hội thoại...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Large Control Bar */}
                <div className="h-32 bg-slate-800/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-12 px-8 shrink-0">

                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`h-20 px-8 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${isMuted
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                    >
                        {isMuted ? <MicrophoneSlash size={40} weight="fill" /> : <Microphone size={40} weight="fill" />}
                        <span className="text-xl font-bold">{isMuted ? 'Mở Mic' : 'Tắt Mic'}</span>
                    </button>

                    <button
                        onClick={() => setIsCamOff(!isCamOff)}
                        className={`h-20 px-8 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${isCamOff
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                    >
                        {isCamOff ? <VideoCameraSlash size={40} weight="fill" /> : <VideoCamera size={40} weight="fill" />}
                        <span className="text-xl font-bold">{isCamOff ? 'Bật cam' : 'Tắt Cam'}</span>
                    </button>

                    <div className="w-px h-12 bg-white/10 mx-4" />

                    <button
                        onClick={onEndCall}
                        className="h-20 px-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-4 transition-all shadow-xl shadow-red-900/40 active:scale-95 border border-red-400/50"
                    >
                        <PhoneDisconnect size={40} weight="fill" />
                        <span className="text-2xl font-black uppercase">Kết Thúc</span>
                    </button>

                </div>
            </div>
        </div>
    )
}

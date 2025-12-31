import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, UserFocus, IdentificationCard, Gear, Faders, Person, Info } from '@phosphor-icons/react'
import { CameraTracker } from '../../components/kiosk'
import EngineeringDetailHeader from '../../components/kiosk/EngineeringDetailHeader'
import { useKioskSettings } from '../../stores/kioskSettings'

interface CameraTestScreenProps {
    onBack: () => void
}

// Internal Tooltip Component
const InfoTooltip = ({ content }: { content: string }) => (
    <div className="group relative inline-flex items-center ml-2">
        <Info size={14} className="text-white/30 hover:text-white cursor-help transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg border border-white/10 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50 text-center leading-relaxed">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
        </div>
    </div>
)

export default function CameraTestScreen({ onBack }: CameraTestScreenProps) {
    const { welcomeThreshold, transitionThreshold, setWelcomeThreshold, setTransitionThreshold } = useKioskSettings()

    // Metrics
    const [isDetected, setIsDetected] = useState(false)
    const [proximity, setProximity] = useState(0)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // Age Estimation (Mock)
    const [estimatedAge, setEstimatedAge] = useState<number | null>(null)
    const [isEstimating, setIsEstimating] = useState(false)

    // Handle face updates
    const handleUserDetected = (detected: boolean, prox?: number) => {
        setIsDetected(detected)
        if (prox !== undefined) {
            setProximity(prox)
        }
        if (!detected) {
            setProximity(0)
            setEstimatedAge(null)
        }
        setDimensions({ width: 640, height: 480 })
    }

    const handleEstimateAge = () => {
        if (!isDetected) return

        setIsEstimating(true)
        setTimeout(() => {
            const age = Math.floor(Math.random() * (50 - 18 + 1)) + 18
            setEstimatedAge(age)
            setIsEstimating(false)
            setTimeout(() => setEstimatedAge(null), 5000)
        }, 1500)
    }

    return (
        // GLOBAL GRID: 64 Rows x 8 Columns
        // Rows: ~30px each. Columns: ~1/8 width.
        <div className="h-full bg-slate-950 text-white overflow-hidden grid grid-cols-8 grid-rows-[repeat(64,minmax(0,1fr))] p-4 gap-y-0 gap-x-8">

            {/* --- ZONE A: HEADER (4h) --- */}
            {/* Rows 1-4 */}
            <div className="row-start-1 row-end-5 col-span-8">
                <EngineeringDetailHeader
                    title="Camera Diagnostic"
                    subtitle="ENGINEERING MODE • PRECISION GRID"
                    icon={Camera}
                    onBack={onBack}
                    rightElement={
                        <p className="font-mono text-emerald-400 text-sm">{dimensions.width}<span className="text-white/30 px-1">x</span>{dimensions.height}</p>
                    }
                />
            </div>

            {/* GAP: Row 5 (1h) */}

            {/* --- ZONE B: CAMERA (24h) --- */}
            {/* Rows 6-29. (Start 6, End 30) - 24 rows.
                4:3 was 27h. 3:2 is 24h (Width 8w=1080px -> Height 720px = 24 * 30).
            */}
            <div className="row-start-6 row-end-[30] col-span-8 bg-slate-900 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                <CameraTracker
                    isActive={true}
                    showPreview={true}
                    autoStart={true}
                    onUserDetected={handleUserDetected}
                    samplingInterval={useKioskSettings.getState().cameraSamplingWelcome}
                    className="w-full h-full object-cover"
                />

                {/* Overlay Metrics */}
                <div className="absolute top-8 left-8 flex items-center gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-4 py-2 rounded-xl backdrop-blur-md border ${isDetected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-red-500/20 border-red-500/50 text-red-300'} font-mono font-bold flex items-center gap-2 text-sm`}
                    >
                        <UserFocus size={18} />
                        {isDetected ? "TRACKING" : "NO FACE"}
                    </motion.div>
                </div>

                {/* Age Result - Centered in Zone B */}
                <AnimatePresence>
                    {estimatedAge && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-black/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl text-center min-w-[280px] pointer-events-auto"
                            >
                                <IdentificationCard size={48} className="text-amber-400 mx-auto mb-3" />
                                <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Age Estimate</p>
                                <p className="text-8xl font-bold text-white tracking-tighter">{estimatedAge}</p>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* GAP: Row 30 (1h) - Wait, previous gap was implicit.
                Camera End: 30.
                Controls Start: 32.
                Gap is Row 31.
            */}

            {/* --- ZONE C: CONTROLS (15h Total) --- */}
            {/* Start Row 32. End Row 47 (32+15=47). */}

            {/* LEFT: PROXIMITY (2w, 15h) */}
            {/* Rows 32-46. (End Line 47) */}
            <div className="row-start-[32] row-end-[47] col-span-2 bg-slate-900/80 rounded-[2rem] border border-white/10 p-5 flex flex-col relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-4 text-blue-400 z-10">
                    <Person size={24} weight="duotone" />
                    <h3 className="text-sm uppercase tracking-widest font-bold text-white/70">Proximity</h3>
                </div>
                <div className="flex-1 w-full bg-slate-950/50 rounded-xl relative overflow-hidden flex items-end border border-white/5 mx-auto">
                    <motion.div
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-300 opacity-80 group-hover:opacity-100 transition-opacity"
                        animate={{ height: `${Math.min(proximity * 100, 100)}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <div className="absolute w-full border-t-2 border-dashed border-green-500/70 left-0 z-10" style={{ bottom: `${welcomeThreshold * 100}%` }} />
                    <div className="absolute w-full border-t-2 border-dashed border-amber-500/70 left-0 z-10" style={{ bottom: `${transitionThreshold * 100}%` }} />
                </div>
                <div className="text-center mt-4 z-10">
                    <p className="text-5xl font-bold text-white font-mono tracking-tighter">{(proximity * 100).toFixed(0)}<span className="text-lg text-white/40 align-top">%</span></p>
                </div>
            </div>

            {/* RIGHT: THRESHOLDS (6w, 7h) */}
            {/* Rows 32-38. (Start 32, End 39) - 7 rows. */}
            <div className="row-start-[32] row-end-[39] col-span-6 bg-slate-900/80 rounded-[2rem] border border-white/10 px-8 py-5 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Faders size={24} weight="duotone" />
                    <h3 className="text-sm uppercase tracking-widest font-bold text-white/70">Thresholds</h3>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wider items-center">
                            <div className="flex items-center">
                                <span>Welcome Zone</span>
                                <InfoTooltip content="Khoảng cách (% chiều cao) để kích hoạt chế độ Chào mừng." />
                            </div>
                            <span className="text-green-400 font-mono text-base">{(welcomeThreshold * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0.05" max="0.9" step="0.01"
                            value={welcomeThreshold}
                            onChange={(e) => setWelcomeThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wider items-center">
                            <div className="flex items-center">
                                <span>Transition Zone</span>
                                <InfoTooltip content="Khoảng cách (% chiều cao) để bắt đầu chuyển đổi trạng thái." />
                            </div>
                            <span className="text-amber-400 font-mono text-base">{(transitionThreshold * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0.1" max="0.95" step="0.01"
                            value={transitionThreshold}
                            onChange={(e) => setTransitionThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* GAP: Row 39 (1h) */}

            {/* RIGHT: SYSTEM (6w, 7h) */}
            {/* Rows 40-46. (Start 40, End 47) - 7 rows. */}
            <div className="row-start-[40] row-end-[47] col-span-6 bg-slate-900/80 rounded-[2rem] border border-white/10 px-8 py-5 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3 text-purple-400 mb-2">
                    <Gear size={24} weight="duotone" />
                    <h3 className="text-sm uppercase tracking-widest font-bold text-white/70">System Performance</h3>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wider items-center">
                            <div className="flex items-center">
                                <span>Camera Sampling</span>
                                <InfoTooltip content="Thời gian nghỉ (ms) giữa các lần quét khuôn mặt." />
                            </div>
                            <span className="font-mono text-blue-300 text-base">{useKioskSettings.getState().cameraSamplingWelcome}ms</span>
                        </div>
                        <input
                            type="range" min="100" max="2000" step="100"
                            value={useKioskSettings.getState().cameraSamplingWelcome}
                            onChange={(e) => useKioskSettings.getState().setSystemParams({ cameraSamplingWelcome: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wider items-center">
                            <div className="flex items-center">
                                <span>TTS Throttle</span>
                                <InfoTooltip content="Thời gian chờ tối thiểu (ms) giữa 2 lần phát giọng nói." />
                            </div>
                            <span className="font-mono text-purple-300 text-base">{useKioskSettings.getState().ttsThrottleDuration / 1000}s</span>
                        </div>
                        <input
                            type="range" min="1000" max="30000" step="1000"
                            value={useKioskSettings.getState().ttsThrottleDuration}
                            onChange={(e) => useKioskSettings.getState().setSystemParams({ ttsThrottleDuration: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>
            </div>

            {/* GAP: Row 47 (1h) */}
            {/* Implicit */}

            {/* --- ZONE D: TRIGGER (2h) --- */}
            {/* Rows 48-49. (Start 48, End 50) */}
            <button
                onClick={handleEstimateAge}
                disabled={!isDetected || isEstimating}
                className={`row-start-[48] row-end-[50] col-span-8 rounded-lg flex items-center justify-center gap-3 font-bold text-base uppercase tracking-widest transition-all ${!isDetected
                    ? 'bg-slate-800 text-white/20 border border-white/5 cursor-not-allowed'
                    : isEstimating
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20'
                    }`}
            >
                {isEstimating ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <IdentificationCard size={24} weight="fill" />
                )}
                {isEstimating ? "Processing..." : "Trigger Manual Analysis"}
            </button>
            <div className='row-start-[64] row-end-[65] col-span-8 w-full flex justify-center items-center'>
                <span className="text-[10px] text-white/20 font-mono tracking-[0.2em] font-light">SYSTEM GRID v4.4 • 3:2 CAM RATIO</span>
            </div>

        </div>
    )
}

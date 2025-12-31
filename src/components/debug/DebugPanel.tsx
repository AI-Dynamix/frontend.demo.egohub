import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDebugStore } from '../../stores/debugStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useLocation } from 'react-router-dom'

/**
 * Debug Panel - Engineer Mode
 * Toggle with Ctrl+Shift+D
 * Shows: route, session state, face detection, timers, performance
 */
export default function DebugPanel() {
    const location = useLocation()
    const { showPanel, toggle, logs, clearLogs, isEnabled } = useDebugStore()
    const sessionState = useSessionStore()

    const [fps, setFps] = useState(0)
    const [memory, setMemory] = useState<string>('N/A')

    // Keyboard shortcut: Ctrl+Shift+D
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault()
                toggle()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [toggle])

    // FPS Counter
    useEffect(() => {
        if (!showPanel) return

        let frameCount = 0
        let lastTime = performance.now()
        let animationId: number

        const countFps = () => {
            frameCount++
            const now = performance.now()
            if (now - lastTime >= 1000) {
                setFps(frameCount)
                frameCount = 0
                lastTime = now
            }
            animationId = requestAnimationFrame(countFps)
        }

        animationId = requestAnimationFrame(countFps)
        return () => cancelAnimationFrame(animationId)
    }, [showPanel])

    // Memory Usage (Chrome only)
    useEffect(() => {
        if (!showPanel) return

        const updateMemory = () => {
            const perf = performance as any
            if (perf.memory) {
                const used = (perf.memory.usedJSHeapSize / 1048576).toFixed(1)
                const total = (perf.memory.jsHeapSizeLimit / 1048576).toFixed(0)
                setMemory(`${used} / ${total} MB`)
            }
        }

        updateMemory()
        const interval = setInterval(updateMemory, 2000)
        return () => clearInterval(interval)
    }, [showPanel])

    if (!isEnabled) return null

    return (
        <AnimatePresence>
            {showPanel && (
                <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    className="fixed top-4 right-4 w-80 max-h-[90vh] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[99999] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-emerald-600/20">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="font-bold text-white text-sm">Engineer Mode</span>
                        </div>
                        <button
                            onClick={toggle}
                            className="text-white/60 hover:text-white text-xs"
                        >
                            ESC to close
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3 text-xs border-b border-white/10">
                        <StatItem label="Route" value={location.pathname} />
                        <StatItem label="FPS" value={fps.toString()} highlight={fps < 30} />
                        <StatItem label="Memory" value={memory} />
                        <StatItem label="Language" value={sessionState.selectedLanguage} />
                        <StatItem
                            label="Face Detected"
                            value={sessionState.isUserDetected ? '✓' : '✗'}
                            highlight={!sessionState.isUserDetected}
                        />
                        <StatItem
                            label="Session"
                            value={sessionState.sessionId?.slice(-8) || 'None'}
                        />
                    </div>

                    {/* Zustand State */}
                    <div className="p-4 border-b border-white/10">
                        <div className="text-xs text-white/60 mb-2">Session State</div>
                        <pre className="text-[10px] text-emerald-400 bg-black/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(
                                {
                                    booted: sessionState.isBooted,
                                    modelLoaded: sessionState.isModelLoaded,
                                    userDetected: sessionState.isUserDetected,
                                    lang: sessionState.selectedLanguage,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>

                    {/* Logs */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="p-3 flex items-center justify-between border-b border-white/10">
                            <span className="text-xs text-white/60">Logs ({logs.length})</span>
                            <button
                                onClick={clearLogs}
                                className="text-[10px] text-red-400 hover:text-red-300"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-48 p-2 space-y-1">
                            {logs.slice(-20).map((log, i) => (
                                <div
                                    key={i}
                                    className={`text-[10px] font-mono p-1 rounded ${log.level === 'error'
                                            ? 'bg-red-500/20 text-red-300'
                                            : log.level === 'warn'
                                                ? 'bg-yellow-500/20 text-yellow-300'
                                                : 'bg-white/5 text-white/70'
                                        }`}
                                >
                                    <span className="opacity-50">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>{' '}
                                    {log.message}
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-[10px] text-white/30 text-center py-4">
                                    No logs yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10 text-[10px] text-white/30 text-center">
                        Ctrl+Shift+D to toggle
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function StatItem({
    label,
    value,
    highlight = false,
}: {
    label: string
    value: string
    highlight?: boolean
}) {
    return (
        <div className="bg-white/5 p-2 rounded-lg">
            <div className="text-white/50 text-[10px] mb-1">{label}</div>
            <div
                className={`font-mono font-bold truncate ${highlight ? 'text-yellow-400' : 'text-white'
                    }`}
            >
                {value}
            </div>
        </div>
    )
}

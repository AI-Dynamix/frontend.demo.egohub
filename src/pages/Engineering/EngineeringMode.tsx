import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    WifiHigh,
    SpeakerHigh,
    Monitor,
    Camera,
    Microphone,
    HardDrives,
    Info,
    ArrowsClockwise,
    Power,
    VirtualReality,
    IdentificationCard,
    RocketLaunch,
    Wrench,
    Sliders,
    GearSix,
    ToggleLeft,
    ToggleRight,
    Globe
} from '@phosphor-icons/react'
import { useKioskSettings } from '../../stores/kioskSettings'
import { useAuthStore } from '../../services/authService'
import { useDebugStore } from '../../stores/debugStore'
import CameraTestScreen from './CameraTestScreen'
import PassportScanScreen from './PassportScanScreen'

// Placeholder button for empty slots
function PlaceholderButton({ index }: { index: number }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all min-h-[100px]"
        >
            <Wrench size={24} className="text-white/20" />
            <span className="text-white/30 text-xs font-mono">Slot {index + 1}</span>
        </motion.button>
    )
}

type EngineeringView = 'dashboard' | 'camera-test' | 'passport-scan'

export default function EngineeringMode() {
    const navigate = useNavigate()
    const [currentView, setCurrentView] = useState<EngineeringView>('dashboard')
    const volume = 80 // TODO: Make this configurable

    // Kiosk settings from store
    const settings = useKioskSettings()
    const debugStore = useDebugStore()

    const handleBack = () => {
        // Use authService to logout
        const { logout } = useAuthStore.getState()
        logout()
        navigate('/')
    }

    const handleRestart = () => {
        window.location.reload()
    }

    // Render Views
    if (currentView === 'camera-test') {
        return <CameraTestScreen onBack={() => setCurrentView('dashboard')} />
    }

    if (currentView === 'passport-scan') {
        return <PassportScanScreen onBack={() => setCurrentView('dashboard')} />
    }

    // ProtectedRoute handles auth, so we can render content directly
    // NO KioskLayout wrapper - RootLayout already provides it
    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            {/* Header */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={handleBack}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Engineering Mode</h1>
                        <p className="text-white/50 text-xs">Device Settings & Diagnostics</p>
                    </div>
                </div>

                {/* System Status */}
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 font-mono text-sm">SYSTEM OK</span>
                    </div>
                    <motion.button
                        onClick={handleRestart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center gap-2 hover:bg-blue-500/30"
                    >
                        <ArrowsClockwise size={18} className="text-blue-400" />
                        <span className="text-blue-400 font-mono text-sm">Restart</span>
                    </motion.button>
                </div>
            </div>

            {/* Content - Scrollable Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Quick Actions Row */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <RocketLaunch size={16} />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                            <motion.button
                                onClick={() => navigate('/home')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center gap-4 hover:bg-indigo-600/30 transition-all"
                            >
                                <VirtualReality size={28} className="text-indigo-400" weight="fill" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">VR 360°</h3>
                                    <p className="text-xs text-white/50">VR Experience</p>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => setCurrentView('passport-scan')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center gap-4 hover:bg-purple-600/30 transition-all"
                            >
                                <IdentificationCard size={28} className="text-purple-400" weight="fill" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Passport</h3>
                                    <p className="text-xs text-white/50">Scanner</p>
                                </div>
                            </motion.button>

                            {/* Grid Planner Tool */}
                            <motion.button
                                onClick={() => navigate('/planner')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center gap-4 hover:bg-orange-600/30 transition-all"
                            >
                                <GearSix size={28} className="text-orange-400" weight="fill" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Layout Tool</h3>
                                    <p className="text-xs text-white/50">Grid Planner</p>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/welcome')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center gap-4 hover:bg-emerald-600/30 transition-all"
                            >
                                <Power size={28} className="text-emerald-400" weight="fill" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Kiosk Mode</h3>
                                    <p className="text-xs text-white/50">Normal start</p>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/support')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center gap-4 hover:bg-amber-600/30 transition-all"
                            >
                                <Info size={28} className="text-amber-400" weight="fill" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Support</h3>
                                    <p className="text-xs text-white/50">AI Help</p>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Settings Row */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Sliders size={16} />
                            Kiosk Settings
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Floating Engineer Button Toggle */}
                            <motion.button
                                onClick={() => settings.setShowFloatingEngineerButton(!settings.showFloatingEngineerButton)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.showFloatingEngineerButton
                                    ? 'bg-emerald-600/20 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <GearSix size={24} className={settings.showFloatingEngineerButton ? 'text-emerald-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Floating Engineer Button</h3>
                                        <p className="text-xs text-white/40">Show gear icon on all screens</p>
                                    </div>
                                </div>
                                {settings.showFloatingEngineerButton
                                    ? <ToggleRight size={32} className="text-emerald-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>

                            {/* Theme Toggle (Light/Dark) */}
                            <motion.button
                                onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.theme === 'light'
                                    ? 'bg-amber-600/20 border-amber-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Monitor size={24} className={settings.theme === 'light' ? 'text-amber-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Giao diện sáng</h3>
                                        <p className="text-xs text-white/40">Light Theme</p>
                                    </div>
                                </div>
                                {settings.theme === 'light'
                                    ? <ToggleRight size={32} className="text-amber-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>

                            {/* Face Detection Toggle */}
                            <motion.button
                                onClick={() => settings.setEnableFaceDetection(!settings.enableFaceDetection)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.enableFaceDetection
                                    ? 'bg-emerald-600/20 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Camera size={24} className={settings.enableFaceDetection ? 'text-emerald-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Face Detection</h3>
                                        <p className="text-xs text-white/40">Auto-detect users via camera</p>
                                    </div>
                                </div>
                                {settings.enableFaceDetection
                                    ? <ToggleRight size={32} className="text-emerald-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>

                            {/* Idle Timeout Toggle */}
                            <motion.button
                                onClick={() => settings.setEnableIdleTimeout(!settings.enableIdleTimeout)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.enableIdleTimeout
                                    ? 'bg-emerald-600/20 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <ArrowsClockwise size={24} className={settings.enableIdleTimeout ? 'text-emerald-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Idle Timeout</h3>
                                        <p className="text-xs text-white/40">Return to welcome after inactivity</p>
                                    </div>
                                </div>
                                {settings.enableIdleTimeout
                                    ? <ToggleRight size={32} className="text-emerald-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>

                            {/* Camera Preview Toggle */}
                            <motion.button
                                onClick={() => settings.setShowCameraPreview(!settings.showCameraPreview)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.showCameraPreview
                                    ? 'bg-emerald-600/20 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Monitor size={24} className={settings.showCameraPreview ? 'text-emerald-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Camera Preview</h3>
                                        <p className="text-xs text-white/40">Show camera in corner</p>
                                    </div>
                                </div>
                                {settings.showCameraPreview
                                    ? <ToggleRight size={32} className="text-emerald-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>
                            {/* Simple Mode Toggle */}
                            <motion.button
                                onClick={() => debugStore.setSimpleMode(!debugStore.isSimpleMode)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${debugStore.isSimpleMode
                                    ? 'bg-emerald-600/20 border-emerald-500/30'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Globe size={24} className={debugStore.isSimpleMode ? 'text-emerald-400' : 'text-white/40'} />
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white">Simple Mode</h3>
                                        <p className="text-xs text-white/40">Skip greeting, auto English</p>
                                    </div>
                                </div>
                                {debugStore.isSimpleMode
                                    ? <ToggleRight size={32} className="text-emerald-400" weight="fill" />
                                    : <ToggleLeft size={32} className="text-white/40" weight="fill" />
                                }
                            </motion.button>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <HardDrives size={16} />
                            Hardware Tests
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                            <motion.button
                                onClick={() => setCurrentView('camera-test')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <Camera size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Camera</h3>
                                    <p className="text-xs text-white/40">Test & Config</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <Microphone size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Microphone</h3>
                                    <p className="text-xs text-white/40">Test</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <Monitor size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Display</h3>
                                    <p className="text-xs text-white/40">Test</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <SpeakerHigh size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Audio {volume}%</h3>
                                    <p className="text-xs text-white/40">Test</p>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Network Row */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <WifiHigh size={16} />
                            Network & System
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <WifiHigh size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">WiFi</h3>
                                    <p className="text-xs text-white/40">Settings</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all"
                            >
                                <Info size={24} className="text-white/60" />
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">System Info</h3>
                                    <p className="text-xs text-white/40">v2.0.0</p>
                                </div>
                            </motion.button>

                            <PlaceholderButton index={10} />
                            <PlaceholderButton index={11} />
                        </div>
                    </div>

                    {/* Placeholder Slots - 4 rows x 4 columns = 16 more slots */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Wrench size={16} />
                            Additional Functions (Empty)
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: 20 }, (_, i) => (
                                <PlaceholderButton key={i} index={i + 12} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-white/30 font-mono text-xs">
                    eGo Engineering Mode • Authorized Personnel Only
                </p>
                <p className="text-white/30 font-mono text-xs">
                    32 Slots Available • 12 Configured
                </p>
            </div>
        </div>
    )
}

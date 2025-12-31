import { useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GearSix } from '@phosphor-icons/react'

import { ScrollToTop } from '../components/common/ScrollToTop'
import { CameraTracker, IdleWarningModal, type CameraTrackerHandle } from '../components/kiosk'
import KioskLayout from '../components/KioskLayout'
import DebugPanel from '../components/debug/DebugPanel'

import { useIdleTimer } from '../hooks/useIdleTimer'
import { useFaceDetection } from '../hooks/useFaceDetection'
import { useSessionStore } from '../stores/sessionStore'
import { useKioskSettings } from '../stores/kioskSettings'

// Loading fallback
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="text-gray-400 text-sm">Loading...</div>
        </div>
    </div>
)

/**
 * Root Layout for the Kiosk application
 * Handles:
 * - Boot sequence
 * - Camera face detection
 * - Idle timeout management
 * - Background and layout
 */
export default function RootLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const cameraRef = useRef<CameraTrackerHandle>(null)

    // Global state from Zustand store
    const isBooted = useSessionStore((state) => state.isBooted)
    const setBooted = useSessionStore((state) => state.setBooted)
    const setModelLoaded = useSessionStore((state) => state.setModelLoaded)
    const setUserDetected = useSessionStore((state) => state.setUserDetected)

    // Kiosk Settings
    const showFloatingEngineerButton = useKioskSettings((state) => state.showFloatingEngineerButton)

    // Face proximity tracking (0-1, larger = closer)
    const [faceProximity, setFaceProximity] = useState(0)

    // Use custom hooks for security logic
    const { showWarning, countdown, dismissWarning, resetTimer } = useIdleTimer({
        isActive: isBooted,
        disabledPaths: ['/welcome'],
    })

    const { handleFaceStatusChange } = useFaceDetection({
        activePaths: ['/home'],
        onStatusChange: (detected) => {
            setUserDetected(detected)
            if (detected) {
                resetTimer()
            }
        },
    })

    // Handle face detection with proximity
    const handleFaceDetection = (detected: boolean, proximity?: number) => {
        handleFaceStatusChange(detected)
        if (proximity !== undefined) {
            setFaceProximity(proximity)
        }
        if (!detected) {
            setFaceProximity(0)
        }
    }

    return (
        <>
            <ScrollToTop />

            {/* Camera always active to monitor security */}
            <CameraTracker
                ref={cameraRef}
                onUserDetected={handleFaceDetection}
                onModelLoaded={() => setModelLoaded(true)}
                isActive={true}
                showPreview={location.pathname === '/welcome' || location.pathname === '/home'}
                autoStart={true}
                samplingInterval={location.pathname === '/home' ? 10000 : 1000} // 10s for home (idle check), 1s for welcome (proximity)
            />

            <KioskLayout>
                <Suspense fallback={<LoadingFallback />}>
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        <Outlet context={{
                            isUserDetected: useSessionStore.getState().isUserDetected,
                            faceProximity
                        }} />

                        {/* Idle Warning Modal */}
                        <AnimatePresence>
                            {showWarning && (
                                <IdleWarningModal
                                    countdown={countdown}
                                    onDismiss={dismissWarning}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </Suspense>
            </KioskLayout>

            {/* Debug Panel - Toggle with Ctrl+Shift+D */}
            <DebugPanel />

            {/* Floating Engineering Mode Button - visible on all pages except boot/engineering */}
            {location.pathname !== '/boot' && location.pathname !== '/engineering' && showFloatingEngineerButton && (
                <motion.button
                    onClick={() => {
                        setBooted(true)
                        navigate('/engineering')
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed right-8 bottom-[12.5%] z-[99999] p-5 rounded-full bg-black/60 hover:bg-black/80 border-2 border-white/30 backdrop-blur-xl shadow-2xl transition-all group"
                    title="Engineering Mode"
                >
                    <GearSix
                        size={36}
                        className="text-white/70 group-hover:text-white group-hover:animate-spin transition-colors"
                        weight="fill"
                    />
                </motion.button>
            )}
        </>
    )
}

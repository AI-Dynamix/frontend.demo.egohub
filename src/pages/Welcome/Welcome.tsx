/**
 * Welcome - Orchestrates the Welcome Flow
 * 
 * FLOW: AttractionPage (idle/slideshow) → SelectorPage (language) → Home
 * 
 * This component manages the transition between attraction and language selector.
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import AttractionPage from "./AttractionPage"
import SelectorPage from "./SelectorPage"
import { useKioskSettings } from "../../stores/kioskSettings"

interface WelcomeContext {
    isUserDetected: boolean
    faceProximity: number // 0-1, larger = closer
}

export default function Welcome() {
    const navigate = useNavigate()
    const { i18n } = useTranslation()
    const { isUserDetected, faceProximity = 0 } = useOutletContext<WelcomeContext>()

    // Use thresholds from settings
    // const transitionThreshold = useKioskSettings((state) => state.transitionThreshold)

    const [showSelector, setShowSelector] = useState(false)
    // Determine state based on proximity
    // Determine state based on proximity
    // 29% threshold for 'Perfect' state (0.29)
    const isFaceClose = isUserDetected && faceProximity >= 0.29

    // Immediate transition effect REMOVED - handled by AttractionPage for "Perfect" delay
    /*
    useEffect(() => {
        if (isFaceClose && !showSelector) {
            handleStart()
        }
    }, [isFaceClose, showSelector])
    */

    const handleStart = () => {
        console.log("Welcome: Starting -> SelectorPage")
        setShowSelector(true)
    }

    const handleLanguageSelect = (lang: string) => {
        console.log("Welcome: Language selected:", lang)

        // Apply language
        i18n.changeLanguage(lang)
        localStorage.setItem('egoKioskLanguage', lang)

        // Navigate to Home with greeting
        navigate('/home', { state: { playGreeting: true, lang } })
    }

    return (
        <div className="relative w-full h-full bg-[#020617]">
            <AnimatePresence mode="wait">
                {!showSelector ? (
                    <motion.div
                        key="attraction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-10"
                    >
                        <AttractionPage
                            onStart={handleStart}
                            isFaceDetected={isUserDetected}
                            isFaceClose={isFaceClose}
                        // faceProximityDuration prop removed
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-20"
                    >
                        <SelectorPage onLanguageSelect={handleLanguageSelect} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

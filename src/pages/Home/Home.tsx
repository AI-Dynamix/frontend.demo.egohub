/**
 * LAYOUT SPECIFICATION (1 Unit = 1/64 screen height = 30px)
 * Total Height: 1920px (64 Units)
 *
 * - Header:       6 Units  (var(--h-header))
 * - Spacer:       1 Unit   (var(--h-spacer))
 * - Zone B:       16 Units (var(--h-upper))
 * - Spacer:       1 Unit   (var(--h-spacer))
 * - Zone C:       30 Units (var(--h-matrix))
 * - Spacer:       1 Unit   (var(--h-spacer))
 * - Zone D:       4 Units  (var(--h-search))
 * - Spacer:       1 Unit   (var(--h-spacer))
 * - Footer:       4 Units  (var(--h-footer))
 *
 * - Grid Gap:     1 Unit   (var(--k-unit))
 */

import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  ForkKnife,
  Bed,
  ShoppingBag,
  Camera,
  Microphone,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { FaBus, FaCalendarAlt, FaWalking, FaStethoscope, FaSimCard, FaShieldAlt } from "react-icons/fa"
import LandmarkCarousel from "../../components/features/landmarks/LandmarkCarousel"
import ZoneBGreeting from "../../components/ZoneBGreeting"
import { Header, Footer } from "../../components/kiosk"
import { PanoramaViewer } from "../../components/viewers"
import HomeLayout from "../../layouts/HomeLayout"
import demoPanorama from "../../assets/demo.png"

// 3D Icons for Zone C (Bright version)
import iconMapPin from "../../assets/icons/bright/map-pin.png"
import iconCalendar from "../../assets/icons/bright/calendar.png"
import iconChat from "../../assets/icons/bright/chat.png"
import iconPhone from "../../assets/icons/bright/phone.png"
import iconCredit from "../../assets/icons/bright/credit.png"
import iconShield from "../../assets/icons/bright/3dicons-shield-front-premium.png"

// Icon mapping for services
const serviceIcons: Record<string, string> = {
  transport: iconMapPin,
  events: iconCalendar,
  guide: iconChat,
  medical: iconPhone,
  card: iconCredit,
  security: iconShield,
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [showGreeting, setShowGreeting] = useState(() => {
    // Check if we came with greeting flag
    const shouldPlay = location.state?.playGreeting === true
    return shouldPlay
  })

  const [showPanorama, setShowPanorama] = useState(false)

  const currentLang = i18n.language || 'vn'

  const mapPOI = [
    { icon: ForkKnife, label: t('search.dining') },
    { icon: Bed, label: t('search.hotels') },
    { icon: ShoppingBag, label: t('search.shopping') },
    { icon: Camera, label: t('search.attractions') }
  ]

  const services = [
    { id: 'transport', title: 'Transport' },
    { id: 'events', title: 'Event' },
    { id: 'guide', title: t('services.guide') },
    { id: 'medical', title: 'Medical' },
    { id: 'card', title: 'Local Visa/Master' },
    { id: 'security', title: 'Call Police' },
  ]

  // Icon glow animation
  const [activeIconIndex, setActiveIconIndex] = useState(0)
  const [isGlowing, setIsGlowing] = useState(true)

  useEffect(() => {
    const glowTimeout = setTimeout(() => setIsGlowing(false), 2000)
    const iconInterval = setTimeout(() => {
      setActiveIconIndex((prev) => (prev + 1) % services.length)
      setIsGlowing(true)
    }, 5000)
    return () => {
      clearTimeout(glowTimeout)
      clearTimeout(iconInterval)
    }
  }, [activeIconIndex, services.length])

  const handleGreetingComplete = useCallback(() => {
    setShowGreeting(false)
    // Clear state so it doesn't re-trigger
    window.history.replaceState({}, document.title)
  }, [])

  const handleDiscoveryClick = useCallback(() => {
    navigate('/vr360')
  }, [navigate])

  return (
    <HomeLayout>
      <Header onDiscoveryClick={handleDiscoveryClick} />

      {/* Spacer Above Search (2/64 = 2 units) */}
      <div className="h-[calc(2*var(--k-unit))] shrink-0" />

      {/* ZONE D: Search (Shrunk ~20%, approx 3.2 units) */}
      <section className="px-12 h-[calc(3.2*var(--k-unit))] shrink-0 z-20">
        <motion.div
          onClick={() => navigate('/search')}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full k-glass-bar rounded-full flex items-center px-10 gap-6 cursor-pointer hover:brightness-105"
        >
          {/* Icons Group */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <MagnifyingGlass size={30} className="text-current opacity-70" />
              <div className="absolute -inset-2 bg-blue-500/10 blur-xl rounded-full" />
            </div>

            {/* Premium Microphone Animation */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-red-500/30 rounded-full blur-lg"
              />
              <Microphone size={26} className="text-red-500 relative z-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" weight="fill" />
            </div>
          </div>

          <div className="flex-1">
            <span className="text-2xl font-bold tracking-tight opacity-90">
              Search or say what you want
            </span>
          </div>

          <div className="flex items-center gap-3">
            {mapPOI.map((poi, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-black/5 dark:bg-white/10 rounded-full transition-all"
                title={poi.label}
                onClick={(e) => e.stopPropagation()}
              >
                <poi.icon className="w-6 h-6 text-current opacity-80" weight="fill" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Spacer Between Search and Matrix (2/64 = 2 units) */}
      <div className="h-[calc(2*var(--k-unit))] shrink-0" />

      {/* ZONE C: Matrix (720px / 24 units) */}
      <section className="px-12 h-[var(--h-matrix)] shrink-0 z-10">
        <div className="grid grid-cols-3 gap-[var(--gap-inner)] h-full">
          {services.map((item, index) => {
            const cornerClass =
              index === 0 ? 'rounded-tl-[3.5rem]' :
                index === 2 ? 'rounded-tr-[3.5rem]' :
                  index === 3 ? 'rounded-bl-[3.5rem]' :
                    index === 5 ? 'rounded-br-[3.5rem]' : '';

            return (
              <motion.div
                key={index}
                onClick={() => {
                  if (item.id === 'guide') navigate('/support')
                  if (item.id === 'security') navigate('/sos')
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`k-glass flex flex-col items-center justify-start py-8 gap-8 group cursor-pointer h-full ${cornerClass}`}
              >
                {/* Icon Wrapper (Uniform circles, aligned top) */}
                <motion.div
                  className="w-[180px] h-[180px] rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center transition-all relative shrink-0"
                  style={{
                    boxShadow: index === activeIconIndex && isGlowing
                      ? '0 0 40px rgba(250, 204, 21, 0.4), 0 0 80px rgba(250, 204, 21, 0.2)'
                      : 'none'
                  }}
                  animate={index === activeIconIndex ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={serviceIcons[item.id]}
                    alt={item.title}
                    className="w-[130px] h-[130px] object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      filter: index === activeIconIndex && isGlowing
                        ? 'drop-shadow(0 0 20px rgba(250,204,21,0.6))'
                        : 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
                    }}
                  />
                </motion.div>

                {/* Text area (Centered horizontally, aligned top vertically) */}
                <div className="px-6 flex-1 flex flex-col items-center justify-start">
                  <span className="text-4xl font-black text-center leading-tight tracking-wide group-hover:text-glow transition-all">
                    {item.title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="h-[var(--gap-outer)] shrink-0" />

      {/* ZONE B (Landmark Carousel) */}
      <section className="h-[var(--h-upper)] shrink-0">
        {showGreeting ? (
          <ZoneBGreeting
            langCode={location.state?.lang || currentLang}
            onComplete={handleGreetingComplete}
          />
        ) : (
          <LandmarkCarousel />
        )}
      </section>

      <div className="h-[var(--gap-outer)] shrink-0" />
      <Footer />

      {/* 360 Panorama Modal Overlay */}
      {
        showPanorama && (
          <PanoramaViewer
            image={demoPanorama}
            onClose={() => setShowPanorama(false)}
          />
        )
      }
    </HomeLayout >
  )
}

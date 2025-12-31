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
import iconCompass from "../../assets/icons/bright/compass.png"
import iconCalendar from "../../assets/icons/bright/calendar.png"
import iconChat from "../../assets/icons/bright/chat.png"
import iconPhone from "../../assets/icons/bright/phone.png"
import iconCredit from "../../assets/icons/bright/credit.png"
import iconShield from "../../assets/icons/bright/3dicons-shield-front-premium.png"

// Icon mapping for services
const serviceIcons: Record<string, string> = {
  transport: iconCompass,
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
    { id: 'transport', title: t('services.transport') },
    { id: 'events', title: t('services.events') },
    { id: 'guide', title: t('services.guide') },
    { id: 'medical', title: t('services.medical') },
    { id: 'card', title: t('services.card') },
    { id: 'security', title: t('services.security') },
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

      {/* Spacer to center Search */}
      <div className="flex-1" />

      {/* ZONE D: Search (Centered between Header and Matrix) */}
      <section className="px-12 h-[var(--h-search)] shrink-0 z-20">
        <motion.div
          onClick={() => navigate('/search')}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full glass-bar rounded-full flex items-center px-10 gap-6 shadow-2xl cursor-pointer hover:bg-white/10 transition-all duration-300 group"
        >
          {/* Icons Group */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <MagnifyingGlass size={36} className="text-white/70 group-hover:text-white transition-colors" />
              <div className="absolute -inset-2 bg-blue-400/10 blur-xl rounded-full group-hover:animate-pulse" />
            </div>

            {/* Premium Microphone Animation */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-red-500/40 rounded-full blur-lg"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }}
                className="absolute inset-0 bg-white/10 rounded-full"
              />
              <Microphone size={32} className="text-white relative z-10 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" weight="fill" />
            </div>
          </div>

          <div className="flex-1">
            <span className="text-3xl font-medium text-white/90 tracking-tight">
              Search or say what you want
            </span>
          </div>

          <div className="flex items-center gap-3">
            {mapPOI.map((poi, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.9 }}
                className="p-4 bg-white/10 rounded-full transition-all group/icon"
                title={poi.label}
                onClick={(e) => e.stopPropagation()}
              >
                <poi.icon className="w-8 h-8 text-white/70 group-hover/icon:text-white group-hover/icon:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" weight="fill" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Spacer to center Search */}
      <div className="flex-1" />

      <svg width="0" height="0" className="absolute">
        <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="15%" stopColor="#facc15" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </svg>

      <div className="h-[var(--gap-outer)] shrink-0" />

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
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                className={`glass flex flex-col items-center justify-center gap-6 group cursor-pointer transition-all duration-300 h-full ${cornerClass}`}
              >
                {/* Icon Wrapper */}
                <motion.div
                  className="p-8 rounded-full bg-white/5 transition-all relative"
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

                <div className="px-6">
                  <span className="text-4xl font-bold text-white text-center leading-tight tracking-wide group-hover:text-glow transition-all">
                    {item.title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="h-[var(--gap-outer)] shrink-0" />

      {/* ZONE B (Moved to Bottom) */}
      {showGreeting ? (
        <ZoneBGreeting
          langCode={location.state?.lang || currentLang}
          onComplete={handleGreetingComplete}
        />
      ) : (
        <LandmarkCarousel />
      )}

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

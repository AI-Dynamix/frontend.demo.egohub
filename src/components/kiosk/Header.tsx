import { useState, useEffect, useRef } from 'react'
import { CloudSun, VirtualReality } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import AnimatedLogo from './AnimatedLogo'

interface Weather {
    temp: number
    description: string
}

interface HeaderProps {
    onDiscoveryClick?: () => void
    onEngineeringModeRequest?: () => void
}

export default function Header({ onDiscoveryClick, onEngineeringModeRequest }: HeaderProps) {
    const { t } = useTranslation()
    const [time, setTime] = useState(new Date())
    const [weather, setWeather] = useState<Weather | null>(null)

    // 5-tap secret trigger for Engineering Mode
    const tapCountRef = useRef(0)
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleWeatherTap = () => {
        if (!onEngineeringModeRequest) return

        // Reset timeout on each tap
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current)
        }

        tapCountRef.current += 1

        if (tapCountRef.current >= 5) {
            tapCountRef.current = 0
            onEngineeringModeRequest()
            return
        }

        // Reset after 2 seconds of no taps
        tapTimeoutRef.current = setTimeout(() => {
            tapCountRef.current = 0
        }, 2000)
    }

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch weather data
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=Ho Chi Minh City&units=metric&appid=4d8fb5b93d4af21d66a2948710284366`
                )
                const data = await response.json()
                setWeather({
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].description,
                })
            } catch (error) {
                console.error('Failed to fetch weather:', error)
            }
        }
        fetchWeather()
        const interval = setInterval(fetchWeather, 600000) // Update every 10 minutes
        return () => clearInterval(interval)
    }, [])

    const currentTheme = {
        cssGradient: 'linear-gradient(135deg, #f97316 0%, #facc15 40%, #059669 100%)',
        shadowColor: '#facc15',
    }

    return (
        <header className="h-[180px] shrink-0 px-12 flex items-center justify-between glass-dark shadow-2xl relative">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <AnimatedLogo />
            </div>

            {/* Time & Date */}
            <div className="text-center">
                <div className="text-4xl font-mono font-bold tracking-tighter text-white">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-300 uppercase tracking-widest mt-1">
                    {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Discovery 360 - The "Point in Zone A" Trigger */}
            <div className="flex items-center gap-8">
                {onDiscoveryClick && (
                    <button
                        onClick={onDiscoveryClick}
                        className="group relative flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] transition-all duration-500 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <VirtualReality className="w-10 h-10 text-white animate-pulse" weight="fill" />
                        <div className="text-left">
                            <span className="block text-xs text-blue-200 font-bold uppercase tracking-widest">Experience</span>
                            <span className="block text-xl font-black text-white uppercase italic">City 360°</span>
                        </div>
                    </button>
                )}

                {/* Weather - 5-tap trigger for Engineering Mode */}
                <button
                    onClick={handleWeatherTap}
                    className="flex items-center gap-6 glass p-4 px-8 rounded-2xl cursor-default select-none"
                >
                    <CloudSun
                        className="w-12 h-12 text-white"
                        weight="fill"
                        style={{ filter: `drop-shadow(0 0 8px ${currentTheme.shadowColor})` }}
                    />
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {weather ? `${weather.temp}°C` : '--°C'}
                        </div>
                        <div className="text-sm text-emerald-400 font-bold uppercase">
                            {weather?.description || t('header.loading')}
                        </div>
                    </div>
                </button>
            </div>
        </header>
    )
}

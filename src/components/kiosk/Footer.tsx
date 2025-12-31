import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Wheelchair } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

const FlagVN = () => (
    <svg viewBox="0 0 540 360" className="w-8 h-8 rounded-sm shadow-sm">
        <rect width="540" height="360" fill="#da251d" />
        <polygon fill="#ff0" points="270,70 299,158 392,158 317,213 345,301 270,246 195,301 223,213 148,158 241,158" />
    </svg>
)

const FlagUS = () => (
    <svg viewBox="0 0 741 390" className="w-8 h-8 rounded-sm shadow-sm">
        <rect width="741" height="390" fill="#3c3b6e" />
        <path d="M0,0H741V30H0ZM0,60H741V90H0ZM0,120H741V150H0ZM0,180H741V210H0ZM0,240H741V270H0ZM0,300H741V330H0ZM0,360H741V390H0" fill="#b22234" />
        <path d="M0,0H296V210H0Z" fill="#3c3b6e" />
        <circle cx="20" cy="15" r="3" fill="#fff" />
    </svg>
)

const FlagJP = () => (
    <svg viewBox="0 0 900 600" className="w-8 h-8 rounded-sm shadow-sm border border-gray-100">
        <rect width="900" height="600" fill="#fff" />
        <circle cx="450" cy="300" r="180" fill="#bc002d" />
    </svg>
)

const FlagKR = () => (
    <svg viewBox="0 0 900 600" className="w-8 h-8 rounded-sm shadow-sm border border-gray-100">
        <rect width="900" height="600" fill="#fff" />
        <circle cx="450" cy="300" r="150" fill="#cd2e3a" />
    </svg>
)

const FlagCN = () => (
    <svg viewBox="0 0 900 600" className="w-8 h-8 rounded-sm shadow-sm">
        <rect width="900" height="600" fill="#ee1c25" />
        <polygon fill="#ffff00" points="150,60 169,118 228,118 181,153 199,211 150,176 101,211 119,153 72,118 131,118" />
    </svg>
)

const EXTRA_LANGUAGES = [
    { code: 'vn', label: 'VN', Flag: FlagVN },
    { code: 'jp', label: 'JP', Flag: FlagJP },
    { code: 'kr', label: 'KR', Flag: FlagKR },
    { code: 'cn', label: 'CN', Flag: FlagCN },
]

export default function Footer() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const currentLang = i18n.language
    const [showExtraLangs, setShowExtraLangs] = useState(false)

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode)
        localStorage.setItem('egoKioskLanguage', langCode)
        setShowExtraLangs(false) // Collapse after selection
    }

    const handleMoreClick = () => {
        setShowExtraLangs(!showExtraLangs)
    }

    const getLanguagesToDisplay = () => {
        const enLang = { code: 'en', label: 'EN', Flag: FlagUS };
        if (showExtraLangs) {
            return [enLang, ...EXTRA_LANGUAGES]
        } else {
            if (currentLang === 'en') {
                return [enLang, { code: 'vn', label: 'VN', Flag: FlagVN }]
            } else {
                const currentLangObj = EXTRA_LANGUAGES.find(lang => lang.code === currentLang)
                const secondLang = currentLangObj || { code: 'vn', label: 'VN', Flag: FlagVN }
                return [enLang, secondLang]
            }
        }
    }

    const languagesToDisplay = getLanguagesToDisplay()

    return (
        <footer className="h-[var(--h-footer)] shrink-0 px-12">
            <div className="h-full flex items-center gap-[var(--gap-inner)]">

                {/* Language Selection */}
                <div className="flex-1 glass-bar rounded-full h-[90px] px-8 flex items-center justify-between shadow-lg transition-all">
                    <div className="flex items-center gap-4"> {/* Group flags */}
                        {languagesToDisplay.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`px-5 py-2 rounded-full font-bold text-xl transition-all flex items-center gap-3 ${currentLang === lang.code
                                    ? 'bg-white/20 text-white font-black scale-105 shadow-lg border border-white/30'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <lang.Flag />
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleMoreClick}
                        className="px-8 py-3 bg-white/10 text-white/80 rounded-full font-bold text-xl hover:bg-white/20 transition-colors shadow-inner"
                    >
                        {showExtraLangs ? '−' : t('footer.more')}
                    </button>
                </div>

                {/* Support Button - Only show when NOT expanded */}
                {!showExtraLangs && (
                    <div onClick={() => navigate('/support')} className="w-[240px] shrink-0 glass-bar rounded-full h-[90px] px-6 flex items-center justify-center gap-4 shadow-lg hover:bg-white/10 transition-colors cursor-pointer group">
                        <Wheelchair className="w-12 h-12 text-white group-hover:scale-110 transition-transform" weight="fill" />
                        <span className="text-2xl font-bold text-white uppercase tracking-tight">Support</span>
                    </div>
                )}

                {/* SOS Emergency Button - Fixed size with glass effect and pink glow animation */}
                <div className="w-[160px] shrink-0 bg-red-600/60 backdrop-blur-md border border-red-500/30 hover:bg-red-500/80 rounded-full h-[90px] px-6 flex items-center justify-center animate-pink-glow cursor-pointer transition-all active:opacity-90">
                    <span className="text-2xl font-black text-white tracking-wider drop-shadow-md">
                        SOS
                    </span>
                </div>

            </div>
        </footer>
    )
}

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import vn from './locales/vn.json'
import en from './locales/en.json'
import jp from './locales/jp.json'
import kr from './locales/kr.json'
import cn from './locales/cn.json'

const resources = {
    vn: { translation: vn },
    en: { translation: en },
    jp: { translation: jp },
    kr: { translation: kr },
    cn: { translation: cn },
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: ['en', 'vn'], // Fallback to English first, then Vietnamese
        lng: localStorage.getItem('egoKioskLanguage') || 'vn',
        debug: true, // Enable debug to see what's happening
        interpolation: {
            escapeValue: false,
        },
        returnEmptyString: false, // Don't return empty string for missing keys
        returnObjects: false, // Don't return objects
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'egoKioskLanguage',
        },
    })

// Supported languages for the LanguageSwitcher component
export const SUPPORTED_LANGUAGES = [
    { code: 'vn', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'kr', name: '한국어', flag: '🇰🇷' },
    { code: 'cn', name: '中文', flag: '🇨🇳' },
]

// Helper function to change language
export const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('egoKioskLanguage', langCode)
}

export default i18n

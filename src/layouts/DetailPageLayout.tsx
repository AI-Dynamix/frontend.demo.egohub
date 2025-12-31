import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@phosphor-icons/react'
import { Footer } from '../components/kiosk'

type BackgroundType = 'dark' | 'gradient' | 'transparent'

interface DetailPageLayoutProps {
    children: ReactNode
    title: string
    subtitle?: string
    onBack: () => void
    background?: BackgroundType
    showFooter?: boolean
    headerRight?: ReactNode
}

const backgroundClasses: Record<BackgroundType, string> = {
    dark: 'bg-gradient-to-br from-slate-900 via-gray-900 to-black',
    gradient: 'bg-gradient-to-b from-black/35 via-black/20 to-black/50',
    transparent: ''
}

/**
 * DetailPageLayout - Layout for detail/sub pages
 * 
 * Provides:
 * - Navigation header with back button and title
 * - Optional footer
 * - Consistent styling across detail pages
 * 
 * Use for: VR, Services, Info pages, etc.
 */
export default function DetailPageLayout({
    children,
    title,
    subtitle,
    onBack,
    background = 'dark',
    showFooter = true,
    headerRight
}: DetailPageLayoutProps) {
    return (
        <div className={`h-full flex flex-col ${backgroundClasses[background]}`}>
            {/* Navigation Header */}
            <header className="px-8 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={onBack}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-white/50 text-sm">{subtitle}</p>
                        )}
                    </div>
                </div>

                {headerRight && (
                    <div className="flex items-center gap-4">
                        {headerRight}
                    </div>
                )}
            </header>

            {/* Main Content - scrollable */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            {/* Footer */}
            {showFooter && <Footer />}
        </div>
    )
}

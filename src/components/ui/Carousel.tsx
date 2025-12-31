import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CarouselProps<T> {
    items: T[]
    renderItem: (item: T, index: number, isActive: boolean) => ReactNode
    renderThumbnail?: (item: T, index: number, isActive: boolean) => ReactNode
    autoPlay?: boolean
    interval?: number
    showIndicators?: boolean
    showThumbnails?: boolean
    thumbnailPosition?: 'left' | 'right' | 'bottom'
    className?: string
    onIndexChange?: (index: number) => void
}

/**
 * Generic Carousel component
 * Data-agnostic - works with any item type via renderItem prop
 */
export function Carousel<T>({
    items,
    renderItem,
    renderThumbnail,
    autoPlay = true,
    interval = 5000,
    showIndicators = true,
    showThumbnails = false,
    thumbnailPosition = 'right',
    className = '',
    onIndexChange,
}: CarouselProps<T>) {
    const [currentIndex, setCurrentIndex] = useState(0)

    // Auto-play logic
    useEffect(() => {
        if (!autoPlay || items.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length)
        }, interval)

        return () => clearInterval(timer)
    }, [autoPlay, interval, items.length])

    // Notify parent of index changes
    useEffect(() => {
        onIndexChange?.(currentIndex)
    }, [currentIndex, onIndexChange])

    const goTo = useCallback((index: number) => {
        setCurrentIndex(index)
    }, [])

    // Navigation functions (available for external control if needed)
    // const goNext = useCallback(() => {
    //     setCurrentIndex((prev) => (prev + 1) % items.length)
    // }, [items.length])

    // const goPrev = useCallback(() => {
    //     setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    // }, [items.length])

    // Get visible thumbnails (3 items: prev, current, next)
    const getVisibleThumbnails = () => {
        if (items.length <= 3) return items.map((item, i) => ({ item, index: i }))

        const prevIndex = (currentIndex - 1 + items.length) % items.length
        const nextIndex = (currentIndex + 1) % items.length

        return [
            { item: items[prevIndex], index: prevIndex },
            { item: items[currentIndex], index: currentIndex },
            { item: items[nextIndex], index: nextIndex },
        ]
    }

    const thumbnailsContent = showThumbnails && renderThumbnail && (
        <div
            className={`flex gap-3 ${thumbnailPosition === 'bottom' ? 'flex-row justify-center' : 'flex-col'
                }`}
        >
            {getVisibleThumbnails().map(({ item, index }) => (
                <motion.div
                    key={index}
                    onClick={() => goTo(index)}
                    className={`cursor-pointer transition-all ${index === currentIndex
                        ? 'ring-2 ring-emerald-400 opacity-100'
                        : 'opacity-50 hover:opacity-100'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {renderThumbnail(item, index, index === currentIndex)}
                </motion.div>
            ))}
        </div>
    )

    return (
        <div className={`relative ${className}`}>
            <div
                className={`flex gap-4 h-full ${thumbnailPosition === 'bottom' ? 'flex-col' : 'flex-row'
                    }`}
            >
                {/* Thumbnails on left */}
                {thumbnailPosition === 'left' && thumbnailsContent}

                {/* Main Content */}
                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full"
                        >
                            {renderItem(items[currentIndex], currentIndex, true)}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Thumbnails on right */}
                {thumbnailPosition === 'right' && thumbnailsContent}
            </div>

            {/* Thumbnails on bottom */}
            {thumbnailPosition === 'bottom' && thumbnailsContent}

            {/* Indicators */}
            {showIndicators && items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goTo(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-6'
                                : 'bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Carousel

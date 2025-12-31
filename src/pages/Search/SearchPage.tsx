/**
 * SearchPage - Tìm kiếm địa điểm với categories
 * Grid: 64x36 (1080x1920, 30px unit)
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    MagnifyingGlass,
    CaretLeft,
    ForkKnife,
    Bed,
    ShoppingBag,
    Camera,
    Coffee,
    Bank,
    MapPin,
    Star
} from '@phosphor-icons/react'
import HomeLayout from '../../layouts/HomeLayout'

const CATEGORIES = [
    { id: 'food', icon: ForkKnife, label: 'Ăn uống', color: '#ef4444' },
    { id: 'hotel', icon: Bed, label: 'Khách sạn', color: '#8b5cf6' },
    { id: 'shopping', icon: ShoppingBag, label: 'Mua sắm', color: '#f59e0b' },
    { id: 'travel', icon: Camera, label: 'Du lịch', color: '#3b82f6' },
    { id: 'cafe', icon: Coffee, label: 'Quán cà phê', color: '#78350f' },
    { id: 'museum', icon: Bank, label: 'Bảo tàng', color: '#059669' },
]

const SUGGESTIONS = [
    { id: 1, name: 'Chợ Bến Thành', type: 'Du lịch', rating: 4.5, distance: '1.2 km' },
    { id: 2, name: 'Phở 2000', type: 'Ăn uống', rating: 4.2, distance: '350m' },
    { id: 3, name: 'Rex Hotel', type: 'Khách sạn', rating: 4.6, distance: '500m' },
    { id: 4, name: 'Highlands Coffee', type: 'Quán cà phê', rating: 4.1, distance: '200m' },
]

export default function SearchPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    return (
        <HomeLayout>
            <div className="flex flex-col h-full">
                {/* Header - 6 units (180px) */}
                <header className="h-[calc(6*var(--k-unit))] shrink-0 flex items-center px-8 gap-4">
                    <motion.button
                        onClick={() => navigate(-1)}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        <CaretLeft size={32} className="text-current" />
                    </motion.button>
                    <h1 className="text-4xl font-black text-current">TÌM KIẾM</h1>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto px-8 pb-8 flex flex-col gap-8">

                    {/* Search Bar - Animated from Home */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="w-full h-[90px] k-glass-bar rounded-full flex items-center px-8 gap-4 shadow-lg"
                    >
                        <MagnifyingGlass size={32} className="text-current opacity-60 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm địa điểm, nhà hàng, khách sạn..."
                            className="flex-1 bg-transparent text-2xl font-bold text-current placeholder-current/30 focus:outline-none h-full"
                            autoFocus
                        />
                    </motion.div>

                    {/* Categories Grid */}
                    <section>
                        <h2 className="text-2xl font-black text-current opacity-60 uppercase tracking-wider mb-4">
                            Danh mục
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            {CATEGORIES.map((cat, index) => (
                                <motion.button
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-4 ${selectedCategory === cat.id
                                        ? 'border-blue-500 shadow-xl scale-105 bg-blue-500/10'
                                        : 'k-glass border-transparent'
                                        }`}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div
                                        className="p-6 rounded-full shadow-lg"
                                        style={{ background: cat.color }}
                                    >
                                        <cat.icon size={48} className="text-white" weight="fill" />
                                    </div>
                                    <span className="text-2xl font-black">{cat.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* Suggestions */}
                    <section>
                        <h2 className="text-2xl font-black text-current opacity-60 uppercase tracking-wider mb-4">
                            Đề xuất cho bạn
                        </h2>
                        <div className="flex flex-col gap-3">
                            {SUGGESTIONS.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                    className="k-glass rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:brightness-105"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                                        <MapPin size={32} className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black">{item.name}</h3>
                                        <p className="text-lg opacity-60 font-medium">{item.type}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400 font-black">
                                            <Star size={20} weight="fill" /> {item.rating}
                                        </span>
                                        <span className="opacity-40 text-sm font-bold">{item.distance}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </HomeLayout>
    )
}

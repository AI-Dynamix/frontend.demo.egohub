import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Funnel, Star, Clock, MapPin, Tag } from '@phosphor-icons/react';
import { MOCK_RESTAURANTS, RESTAURANT_CATEGORIES } from '../data/mockRestaurants';
import HomeLayout from '../../../layouts/HomeLayout';
import KioskHeader from '../../../components/kiosk-ui/KioskHeader';
import KioskInput from '../../../components/kiosk-ui/KioskInput';
import KioskChip from '../../../components/kiosk-ui/KioskChip';
import KioskButton from '../../../components/kiosk-ui/KioskButton';

import { useSearchParams } from 'react-router-dom';

export default function RestaurantSearch() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Payment States
    const [showPayment, setShowPayment] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const handleBook = (item: any) => {
        setSelectedItem(item);
        setShowPayment(true);
    };

    const handlePaymentComplete = (method: 'qr' | 'card', email?: string) => {
        if (selectedItem) {
            import('../../../services/OrderService').then(({ OrderService }) => {
                OrderService.saveOrder({
                    items: [selectedItem],
                    totalAmount: selectedItem.price || '150.000đ', // Fallback price if missing
                    paymentMethod: method,
                    email
                });
            });
        }
    };

    const filteredRestaurants = MOCK_RESTAURANTS.filter(r =>
        (selectedCategory === 'all' || r.category === selectedCategory) &&
        (r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <HomeLayout>
            <div className="flex flex-col h-full bg-slate-900/50">
                {/* 1. Header & Search */}
                <div className="shrink-0 flex flex-col gap-4 px-8 pt-2 pb-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-20">
                    <KioskHeader
                        title="ĂN UỐNG & NHÀ HÀNG"
                        rightElement={
                            <KioskButton variant="secondary" size="lg" icon={Funnel} className="aspect-square !px-0 flex items-center justify-center">
                            </KioskButton>
                        }
                    />

                    <KioskInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Tìm món ngon, nhà hàng..."
                    />
                </div>

                {/* 2. Categories */}
                <div className="shrink-0 px-8 py-2 overflow-x-auto flex gap-3 no-scrollbar pb-6">
                    {RESTAURANT_CATEGORIES.map(cat => (
                        <KioskChip
                            key={cat.id}
                            label={cat.label}
                            icon={cat.icon}
                            active={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                        />
                    ))}
                </div>

                {/* 3. Restaurant List */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-white/60 uppercase tracking-widest pl-2">
                        {filteredRestaurants.length} kết quả
                    </h2>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredRestaurants.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-[320px] rounded-[32px] overflow-hidden relative group cursor-pointer border border-white/10 shadow-xl"
                            >
                                {/* Background Image */}
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />

                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    {/* Top Badges */}
                                    <div className="absolute top-6 left-6 flex gap-2">
                                        {item.isPromo && (
                                            <div className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm font-bold shadow-lg flex items-center gap-1">
                                                <Tag size={16} weight="fill" />
                                                {item.promoText}
                                            </div>
                                        )}
                                        <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/10 text-sm font-medium flex items-center gap-1">
                                            <Clock size={16} className="text-orange-400" />
                                            {item.deliveryTime}
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <h3 className="text-3xl font-black text-white mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">
                                        {item.name}
                                    </h3>

                                    <div className="flex items-center gap-4 text-white/80 mb-3">
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                            <Star size={20} weight="fill" />
                                            {item.rating} <span className="text-white/40 font-normal">({item.reviewCount})</span>
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/40" />
                                        <span className="flex items-center gap-1">
                                            <MapPin size={18} className="text-emerald-400" weight="fill" />
                                            {item.distance}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/40" />
                                        <span className="text-emerald-300 font-bold">{item.priceRange}</span>
                                    </div>

                                    {/* Categories/Tags */}
                                    <div className="flex gap-2 opacity-70">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="text-sm px-2 py-0.5 rounded border border-white/20 bg-white/5 text-white">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <PaymentWrapper
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                totalAmount={selectedItem?.price || '0đ'}
                onPaymentComplete={handlePaymentComplete}
            />

            <HistoryWrapper
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </HomeLayout >
    );
}

// Lazy Load Wrappers
import { lazy, Suspense } from 'react';
const PaymentModal = lazy(() => import('../../../components/features/payment/PaymentModal'));
const OrderRetrievalModal = lazy(() => import('../../../components/features/orders/OrderRetrievalModal'));

function PaymentWrapper(props: any) {
    if (!props.isOpen) return null;
    return (
        <Suspense fallback={null}>
            <PaymentModal {...props} />
        </Suspense>
    )
}

function HistoryWrapper(props: any) {
    if (!props.isOpen) return null;
    return (
        <Suspense fallback={null}>
            <OrderRetrievalModal {...props} />
        </Suspense>
    )
}

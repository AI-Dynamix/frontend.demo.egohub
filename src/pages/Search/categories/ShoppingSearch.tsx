import { useState } from 'react';
import { motion } from 'framer-motion';
import { Funnel, Star, Clock, MapPin, ShoppingBag } from '@phosphor-icons/react';
import { MOCK_SHOPS, SHOP_CATEGORIES } from '../data/mockShops';
import HomeLayout from '../../../layouts/HomeLayout';
import KioskHeader from '../../../components/kiosk-ui/KioskHeader';
import KioskInput from '../../../components/kiosk-ui/KioskInput';
import KioskChip from '../../../components/kiosk-ui/KioskChip';
import KioskButton from '../../../components/kiosk-ui/KioskButton';

export default function ShoppingSearch() {
    const [selectedCategory, setSelectedCategory] = useState('all');
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
                    totalAmount: '500.000đ', // Mock price for shopping
                    paymentMethod: method,
                    email
                });
            });
        }
    };

    const filteredShops = MOCK_SHOPS.filter(s =>
        (selectedCategory === 'all' || s.category === selectedCategory) &&
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <HomeLayout>
            <div className="flex flex-col h-full bg-slate-900/50">
                {/* 1. Header (Height: ~10 units) */}
                <div className="shrink-0 flex flex-col gap-4 px-8 pt-2 pb-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-20">
                    <KioskHeader
                        title="MUA SẮM & CỬA HÀNG"
                        onHistoryClick={() => setShowHistory(true)}
                        rightElement={
                            <KioskButton variant="secondary" size="lg" icon={Funnel} className="aspect-square !px-0 flex items-center justify-center">
                            </KioskButton>
                        }
                    />

                    <KioskInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Tìm thương hiệu, cửa hàng..."
                    />
                </div>

                {/* 2. Categories */}
                <div className="shrink-0 px-8 py-2 overflow-x-auto flex gap-3 no-scrollbar pb-6">
                    {SHOP_CATEGORIES.map(cat => (
                        <KioskChip
                            key={cat.id}
                            label={cat.label}
                            icon={cat.icon}
                            active={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                        />
                    ))}
                </div>

                {/* 3. Shop List */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-white/60 uppercase tracking-widest pl-2">
                        {filteredShops.length} kết quả
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredShops.map((item) => (
                            <motion.div
                                key={item.id}
                                onClick={() => handleBook(item)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex h-[200px] bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group cursor-pointer shadow-xl hover:border-blue-500/50 transition-colors"
                            >
                                {/* Image */}
                                <div className="w-[180px] h-full relative shrink-0">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2 line-clamp-2">
                                            {item.name}
                                        </h3>

                                        <div className="flex flex-col gap-2 text-white/70">
                                            <span className="flex items-center gap-2">
                                                <Star size={18} weight="fill" className="text-yellow-400" />
                                                <span className="font-bold">{item.rating}</span>
                                                <span className="text-white/40">({item.reviewCount})</span>
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock size={18} className="text-blue-400" />
                                                {item.openTime}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <MapPin size={18} className="text-green-400" />
                                                {item.floor} • {item.distance}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-2">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/80 border border-white/5">
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
                totalAmount={selectedItem?.price || '500.000đ'}
                onPaymentComplete={handlePaymentComplete}
            />

            <HistoryWrapper
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </HomeLayout>
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

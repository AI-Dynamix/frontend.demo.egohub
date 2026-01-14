import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Funnel, Star, CheckCircle, Lightning, Ticket } from '@phosphor-icons/react';
import { MOCK_TICKETS, TICKET_CATEGORIES } from '../data/mockTickets';
import HomeLayout from '../../../layouts/HomeLayout';
import KioskHeader from '../../../components/kiosk-ui/KioskHeader';
import KioskInput from '../../../components/kiosk-ui/KioskInput';
import KioskChip from '../../../components/kiosk-ui/KioskChip';
import KioskButton from '../../../components/kiosk-ui/KioskButton';

import { useSearchParams } from 'react-router-dom';

export default function TicketSearch() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    const [showPayment, setShowPayment] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    const handleBook = (ticket: any) => {
        setSelectedTicket(ticket);
        setShowPayment(true);
    };

    const handlePaymentComplete = (method: 'qr' | 'card', email?: string) => {
        if (selectedTicket) {
            import('../../../services/OrderService').then(({ OrderService }) => {
                OrderService.saveOrder({
                    items: [selectedTicket],
                    totalAmount: selectedTicket.price,
                    paymentMethod: method,
                    email
                });
            });
        }
    };

    const filteredTickets = MOCK_TICKETS.filter(t =>
        (selectedCategory === 'all' || t.category === selectedCategory || (selectedCategory === 'attraction' && t.category === 'museum')) &&
        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <HomeLayout>
            <div className="flex flex-col h-full bg-slate-900/50">
                {/* 1. Header (Height: ~10 units) */}
                <div className="shrink-0 flex flex-col gap-4 px-8 pt-2 pb-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-20">
                    <KioskHeader
                        title="VÉ THAM QUAN & TOUR"
                        onHistoryClick={() => setShowHistory(true)}
                        rightElement={
                            <KioskButton variant="secondary" size="lg" icon={Funnel} className="aspect-square !px-0 flex items-center justify-center">
                            </KioskButton>
                        }
                    />

                    {/* Search Bar */}
                    <KioskInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Tìm hoạt động, địa điểm vui chơi..."
                    />
                </div>

                {/* 2. Categories */}
                <div className="shrink-0 px-8 py-2 overflow-x-auto flex gap-3 no-scrollbar pb-6">
                    {TICKET_CATEGORIES.map(cat => (
                        <KioskChip
                            key={cat.id}
                            label={cat.label}
                            active={selectedCategory === cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            variant='default'
                            className={selectedCategory === cat.id ? '!bg-purple-600 !border-purple-500 !shadow-purple-900/40' : ''}
                        />
                    ))}
                </div>

                {/* 3. Ticket List (Klook Style Cards) */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                    {/* Featured / Best Sellers first */}
                    {filteredTickets.map((item) => (
                        <motion.div
                            key={item.id}
                            onClick={() => handleBook(item)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-lg cursor-pointer hover:border-purple-500/50 transition-colors relative group"
                        >
                            {/* Image */}
                            <div className="h-[200px] relative overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {item.isBestSeller && (
                                    <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-sm shadow-md uppercase tracking-wider">
                                        Best Seller
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                                    <Ticket size={14} className="text-purple-400" />
                                    {item.location}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white mb-2 line-clamp-2 leading-tight">
                                        {item.name}
                                    </h3>

                                    <div className="flex items-center gap-3 text-sm text-white/60 mb-3">
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                            <Star size={14} weight="fill" />
                                            {item.rating} <span className="text-white/40 font-normal">({item.reviewCount})</span>
                                        </span>
                                        {item.features.slice(0, 1).map(f => ( // Show first feature only
                                            <span key={f} className="flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                                <Lightning size={14} className="text-yellow-400" weight="fill" />
                                                {f}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-white/70 border border-white/10">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                                        <CheckCircle size={14} weight="fill" />
                                        Instant Confirmation
                                    </div>
                                    <div className="text-right">
                                        {item.originalPrice && (
                                            <span className="text-white/40 line-through text-xs block">{item.originalPrice}</span>
                                        )}
                                        <span className="text-2xl font-black text-purple-400 block">{item.price}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>



            {/* Fix: Better simple Dynamic Import or just import it at top */}
            <PaymentWrapper
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                totalAmount={selectedTicket?.price || '0đ'}
                onPaymentComplete={handlePaymentComplete}
            />

            <HistoryWrapper
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </HomeLayout>
    )
}

// Simple wrapper to handle lazy loading cleanly
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

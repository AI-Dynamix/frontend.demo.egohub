import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Funnel, Star, MapPin, Calendar, Users, WifiHigh, SwimmingPool, Info } from '@phosphor-icons/react';
import { MOCK_HOTELS } from '../data/mockHotels';
import HomeLayout from '../../../layouts/HomeLayout';
import KioskHeader from '../../../components/kiosk-ui/KioskHeader';
import KioskInput from '../../../components/kiosk-ui/KioskInput';
import KioskButton from '../../../components/kiosk-ui/KioskButton';

export default function HotelSearch() {
    const navigate = useNavigate();
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
                    totalAmount: selectedItem.pricePerNight || '1.200.000đ',
                    paymentMethod: method,
                    email
                });
            });
        }
    };

    // Date & Guest states (Visual only for now)
    const [checkInDate] = useState('Nay, 9 Th1');
    const [checkOutDate] = useState('Mai, 10 Th1');
    const [guests] = useState('2 người lớn, 1 phòng');

    const filteredHotels = MOCK_HOTELS.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <HomeLayout>
            <div className="flex flex-col h-full bg-slate-900/50">
                {/* 1. Header (Height: ~10 units) */}
                <div className="shrink-0 flex flex-col gap-4 px-8 pt-2 pb-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-20">
                    <KioskHeader
                        title="KHÁCH SẠN & CHỖ NỞ"
                        onHistoryClick={() => setShowHistory(true)}
                        rightElement={
                            <KioskButton variant="secondary" size="lg" icon={Funnel} className="aspect-square !px-0 flex items-center justify-center">
                            </KioskButton>
                        }
                    />

                    {/* Booking Control Bar (Booking.com style) */}
                    <div className="w-full bg-blue-900/40 backdrop-blur-md rounded-2xl flex p-2 border border-blue-500/30">
                        {/* Dates */}
                        <button className="flex-1 flex items-center gap-3 px-4 py-3 border-r border-white/10 hover:bg-white/5 rounded-l-xl transition-colors text-left">
                            <Calendar size={28} className="text-blue-400" />
                            <div>
                                <p className="text-white font-bold text-xl">{checkInDate} - {checkOutDate}</p>
                                <p className="text-white/50 text-sm">1 đêm</p>
                            </div>
                        </button>

                        {/* Guests */}
                        <button className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-r-xl transition-colors text-left pl-6">
                            <Users size={28} className="text-blue-400" />
                            <div>
                                <p className="text-white font-bold text-xl">{guests}</p>
                                <p className="text-white/50 text-sm">Thay đổi</p>
                            </div>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <KioskInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Tìm tên khách sạn, địa điểm..."
                        className="!h-16" // Slightly smaller for hotel search
                    />
                </div>

                {/* 2. Hotel List */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-6 pt-2">
                    <h2 className="text-xl font-bold text-white/60 uppercase tracking-widest flex justify-between items-center px-2">
                        <span>{filteredHotels.length} khách sạn tìm thấy</span>
                        <span className="text-blue-400 text-sm flex items-center gap-1"><MapPin /> Xem bản đồ</span>
                    </h2>

                    <div className="flex flex-col gap-6">
                        {filteredHotels.map((item) => (
                            <motion.div
                                key={item.id}
                                onClick={() => handleBook(item)}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[280px] shadow-lg cursor-pointer hover:border-blue-500/50 transition-colors"
                            >
                                {/* Image (Left 40%) */}
                                <div className="w-full md:w-[40%] h-[200px] md:h-full relative shrink-0">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {item.isPromo && (
                                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                            {item.promoText}
                                        </div>
                                    )}
                                </div>

                                {/* Content (Right 60%) */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-1">{item.name}</h3>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(item.stars)].map((_, i) => <Star key={i} weight="fill" size={16} />)}
                                                    </div>
                                                    <span className="text-white/40 text-sm">• {item.distance} from center</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">
                                                    {item.rating}
                                                </div>
                                                <span className="text-white/40 text-xs mt-1">{item.reviewCount} reviews</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 my-3 text-white/60">
                                            {item.amenities.map(a => {
                                                if (a === 'wifi') return <WifiHigh key={a} size={24} />
                                                if (a === 'pool') return <SwimmingPool key={a} size={24} />
                                                return <Info key={a} size={24} />
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between border-t border-white/5 pt-4">
                                        <div className="flex flex-col text-green-400 text-sm">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Free cancellation</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> No prepayment</span>
                                        </div>
                                        <div className="text-right">
                                            {item.originalPrice && (
                                                <span className="text-white/40 line-through text-sm block">{item.originalPrice}</span>
                                            )}
                                            <span className="text-4xl font-black text-white block tracking-tight">{item.pricePerNight}</span>
                                            <span className="text-white/40 text-xs">per night, taxes included</span>
                                        </div>
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
                totalAmount={selectedItem?.pricePerNight || '0đ'}
                onPaymentComplete={handlePaymentComplete}
            />

            <HistoryWrapper
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </HomeLayout>
    )
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

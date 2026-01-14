import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowsLeftRight, CalendarBlank, MapPin, Ticket, Chair, Star } from '@phosphor-icons/react';
import { MOCK_TRIPS, TRANSPORT_TYPES } from '../data/mockTransport';
import HomeLayout from '../../../layouts/HomeLayout';
import KioskHeader from '../../../components/kiosk-ui/KioskHeader';
import KioskButton from '../../../components/kiosk-ui/KioskButton';

export default function TransportSearch() {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('bus');
    const [fromLoc] = useState('Hồ Chí Minh (SGN)');
    const [toLoc] = useState('Đà Lạt (DLI)');
    const [date] = useState('Hôm nay, 19/06');

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
                    totalAmount: selectedItem.price || '350.000đ',
                    paymentMethod: method,
                    email
                });
            });
        }
    };

    const filteredTrips = MOCK_TRIPS.filter(t => t.type === selectedType);

    return (
        <HomeLayout>
            <div className="flex flex-col h-full bg-slate-900/50">
                {/* 1. Header & Route Selector */}
                <div className="shrink-0 flex flex-col gap-6 px-8 pt-2 pb-6 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent sticky top-0 z-20">
                    <KioskHeader
                        title="VÉ XE & TÀU"
                        onHistoryClick={() => setShowHistory(true)}
                    />

                    {/* Route Search Box (Card style) */}
                    <div className="bg-white rounded-3xl p-1 shadow-2xl flex flex-col">
                        <div className="flex items-center relative">
                            {/* From */}
                            <div className="flex-1 p-5 border-r border-slate-100 relative">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Điểm đi</label>
                                <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <MapPin size={24} className="text-blue-500" weight="fill" />
                                    {fromLoc}
                                </div>
                            </div>

                            {/* Swap Button */}
                            <button className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white z-10 hover:bg-slate-200 transition-colors">
                                <ArrowsLeftRight size={20} className="text-slate-600" />
                            </button>

                            {/* To */}
                            <div className="flex-1 p-5 pl-10">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Điểm đến</label>
                                <div className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <MapPin size={24} className="text-orange-500" weight="fill" />
                                    {toLoc}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
                            <div className="flex items-center gap-2 text-slate-700 font-bold px-4">
                                <CalendarBlank size={24} className="text-slate-400" />
                                {date}
                            </div>
                            <KioskButton size="lg" className="px-8" icon={Ticket}>
                                Tìm kiếm
                            </KioskButton>
                        </div>
                    </div>
                </div>

                {/* 2. Transport Types */}
                <div className="shrink-0 px-8 pb-4">
                    <div className="bg-white/5 p-1 rounded-2xl flex backdrop-blur-md border border-white/10">
                        {TRANSPORT_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${selectedType === type.id
                                    ? 'bg-white text-slate-900 shadow-lg font-bold'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                                    }`}
                            >
                                <type.icon size={24} weight={selectedType === type.id ? 'fill' : 'regular'} />
                                <span className="text-lg">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Trip List */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-4">
                    {filteredTrips.map((trip) => (
                        <motion.div
                            key={trip.id}
                            onClick={() => handleBook(trip)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.99 }}
                            className="bg-white rounded-3xl p-6 shadow-xl cursor-pointer hover:shadow-2xl transition-all border border-transparent hover:border-blue-500/30"
                        >
                            {/* Trip Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    {/* Logo Placeholder */}
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs text-center p-1">
                                        LOGO
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{trip.operator}</h3>
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                                            <Star weight="fill" /> {trip.rating}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-blue-600 block">{trip.price}</span>
                                    <span className="text-slate-400 text-xs font-bold uppercase">{trip.seatType}</span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="flex items-center gap-8 mb-6">
                                <div>
                                    <span className="text-3xl font-black text-slate-800">{trip.departureTime}</span>
                                    <span className="block text-slate-500 font-bold">{trip.from}</span>
                                </div>

                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-xs font-bold text-slate-400 mb-1">{trip.duration}</span>
                                    <div className="w-full h-1 bg-slate-200 rounded-full relative">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400" />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400" />
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-3xl font-black text-slate-800">{trip.arrivalTime}</span>
                                    <span className="block text-slate-500 font-bold">{trip.to}</span>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Chair size={18} weight="fill" className={trip.seatsAvailable < 10 ? "text-red-500" : "text-green-500"} />
                                    Còn {trip.seatsAvailable} chỗ
                                </span>
                                <span className="flex items-center gap-2 text-blue-600">
                                    Chi tiết <Ticket size={18} weight="fill" />
                                </span>
                            </div>
                        </motion.div>
                    ))}
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

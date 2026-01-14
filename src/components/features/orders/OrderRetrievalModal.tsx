import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserFocus, Calculator, X, Receipt, Clock } from '@phosphor-icons/react';
import { OrderService, type Order } from '../../../services/OrderService';
import KioskButton from '../../kiosk-ui/KioskButton';

interface OrderRetrievalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'face' | 'pin' | 'list';

export default function OrderRetrievalModal({ isOpen, onClose }: OrderRetrievalModalProps) {
    const [step, setStep] = useState<Step>('face');
    const [pin, setPin] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep('face');
            setPin('');
            // Auto start face scan
            setTimeout(() => {
                handleFaceSuccess();
            }, 2500);
        }
    }, [isOpen]);

    const handleFaceSuccess = () => {
        setStep('pin');
    };

    const handlePinSubmit = async () => {
        // Mock PIN check
        if (pin.length === 4) {
            const data = await OrderService.lookupByFaceId();
            setOrders(data);
            setStep('list');
        }
    };

    const handlePinPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                // Auto submit on 4th digit
                setTimeout(() => {
                    // Logic inside setPin callback or effect better, but for mock this is fine
                    // Just triggering the effect via state change if I had one, or calling logic directly
                    // calling handlePinSubmit wouldn't see new state immediately if standard React.
                    // So we'll cheat visually or use Effect.
                }, 100);
            }
        }
    };

    // Effect to watch PIN for auto-submit behavior simulation
    useEffect(() => {
        if (step === 'pin' && pin.length === 4) {
            setTimeout(async () => {
                const data = await OrderService.lookupByFaceId(); // Quick lookup
                setOrders(data);
                setStep('list');
            }, 500);
        }
    }, [pin, step]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl h-[80vh] bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-10 p-4 rounded-full bg-white/10 text-white"
                >
                    <X size={32} />
                </button>

                <div className="flex-1 flex items-center justify-center p-12">
                    <AnimatePresence mode="wait">
                        {step === 'face' && (
                            <motion.div
                                key="face"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-8"
                            >
                                <div className="relative">
                                    <div className="w-64 h-64 rounded-full border-4 border-blue-500/30 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                                        <UserFocus size={100} className="text-blue-400" />

                                        {/* Scanning Line */}
                                        <motion.div
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                            className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.8)]"
                                        />
                                    </div>
                                    <div className="absolute -inset-4 border border-blue-500/20 rounded-full animate-ping" />
                                </div>
                                <h2 className="text-4xl font-bold text-white text-center">Đang nhận diện khuôn mặt...</h2>
                                <p className="text-xl text-white/50">Vui lòng nhìn thẳng vào camera</p>
                            </motion.div>
                        )}

                        {step === 'pin' && (
                            <motion.div
                                key="pin"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center gap-8 w-full max-w-md"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-6 rounded-full bg-purple-500/20 text-purple-400 mb-2">
                                        <Calculator size={48} weight="fill" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white">Nhập mã PIN xác nhận</h2>
                                    <p className="text-white/50">Nhập mã PIN 4 số của bạn</p>
                                </div>

                                {/* PIN Display */}
                                <div className="flex gap-4 mb-4">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-white scale-125' : 'bg-white/20'}`} />
                                    ))}
                                </div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-4 w-full">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key) => (
                                        <button
                                            key={key}
                                            disabled={key === ''}
                                            onClick={() => {
                                                if (key === 'del') setPin(prev => prev.slice(0, -1));
                                                else if (typeof key === 'number') handlePinPress(key.toString());
                                            }}
                                            className={`
                                                h-20 rounded-2xl text-2xl font-bold transition-all
                                                ${key === '' ? 'invisible' : ''}
                                                ${key === 'del' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-white hover:bg-white/10 active:scale-95'}
                                            `}
                                        >
                                            {key === 'del' ? 'Xóa' : key}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'list' && (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full h-full flex flex-col gap-6"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div>
                                        <h2 className="text-4xl font-bold text-white">Lịch sử đơn hàng</h2>
                                        <p className="text-white/50 mt-2">Xin chào, Nguyễn Văn A</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-blue-400">{orders.length}</div>
                                        <div className="text-white/40">đơn hàng</div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                    {orders.length === 0 ? (
                                        <div className="text-center text-white/40 py-20 text-xl">
                                            Chưa có đơn hàng nào
                                        </div>
                                    ) : (
                                        orders.map((order) => (
                                            <div key={order.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                        <Receipt size={32} weight="fill" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-white mb-1">
                                                            {order.items[0]?.name}
                                                            {order.items.length > 1 && ` +${order.items.length - 1} món khác`}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-white/50 text-sm">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={16} />
                                                                {new Date(order.date).toLocaleString('vi-VN')}
                                                            </span>
                                                            <span className="uppercase px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white max-w-[200px] truncate">{order.totalAmount}</div>
                                                    <div className="text-white/40 text-sm">{order.paymentMethod === 'qr' ? 'Qua QR' : 'Thẻ QT'}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

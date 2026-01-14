import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CreditCard, CheckCircle, Smartphone, EnvelopeSimple, DownloadSimple, X } from '@phosphor-icons/react';
import KioskButton from '../../kiosk-ui/KioskButton';

type PaymentMethod = 'qr' | 'card';
type PaymentState = 'selection' | 'processing' | 'success';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: string;
    onPaymentComplete: (method: PaymentMethod, email?: string) => void;
}

export default function PaymentModal({ isOpen, onClose, totalAmount, onPaymentComplete }: PaymentModalProps) {
    const [step, setStep] = useState<PaymentState>('selection');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setTimeout(() => {
                setStep('selection');
                setSelectedMethod(null);
                setEmail('');
            }, 300);
        }
    }, [isOpen]);

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        setStep('processing');

        // Simulate processing time
        setTimeout(() => {
            setStep('success');
        }, 2000);
    };

    const handleFinish = () => {
        if (selectedMethod) {
            onPaymentComplete(selectedMethod, email);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-4xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
                >
                    <X size={32} />
                </button>

                {/* Left Side: Summary or Animation */}
                <div className="w-1/3 bg-black/20 p-8 flex flex-col justify-between border-r border-white/5">
                    <div>
                        <h3 className="text-white/60 text-lg uppercase tracking-widest font-bold mb-2">Thanh toán</h3>
                        <div className="text-5xl font-black text-white mb-1">{totalAmount}</div>
                        <div className="text-white/40">Bao gồm thuế & phí</div>
                    </div>

                    <div className="mt-8 flex-1 flex flex-col items-center justify-center opacity-30">
                        {step === 'processing' && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full"
                            />
                        )}
                        {step === 'success' && (
                            <CheckCircle size={100} className="text-green-500" weight="fill" />
                        )}
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="flex-1 p-10 flex flex-col max-h-[600px] overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === 'selection' && (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                <h2 className="text-3xl font-black text-white mb-8">Chọn phương thức thanh toán</h2>

                                <div className="grid gap-6 flex-1">
                                    <button
                                        onClick={() => handleMethodSelect('qr')}
                                        className="flex items-center gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-blue-600/20 hover:border-blue-500 hover:scale-[1.02] transition-all group text-left"
                                    >
                                        <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 text-blue-400 group-hover:text-white transition-colors">
                                            <QrCode size={40} weight="fill" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1">Quét mã QR</h3>
                                            <p className="text-white/60 text-lg">VietQR, Momo, ZaloPay (Đang phát triển)</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleMethodSelect('card')}
                                        className="flex items-center gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-purple-600/20 hover:border-purple-500 hover:scale-[1.02] transition-all group text-left"
                                    >
                                        <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 text-purple-400 group-hover:text-white transition-colors">
                                            <CreditCard size={40} weight="fill" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1">Thẻ quốc tế</h3>
                                            <p className="text-white/60 text-lg">Visa, Mastercard, JCB</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full text-center"
                            >
                                <h2 className="text-3xl font-bold text-white mb-4">Đang xử lý thanh toán...</h2>
                                <p className="text-white/60 text-xl">Vui lòng làm theo hướng dẫn trên thiết bị thanh toán</p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col h-full"
                            >
                                <h2 className="text-3xl font-black text-white mb-2">Thanh toán thành công!</h2>
                                <p className="text-white/60 text-lg mb-8">Bạn muốn nhận vé/biên lai như thế nào?</p>

                                <div className="flex-1 space-y-6">
                                    {/* Email Option */}
                                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
                                                <EnvelopeSimple size={24} weight="fill" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Gửi qua Email</h3>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nhap@email.cua.ban"
                                            className="w-full h-16 rounded-xl bg-black/20 border border-white/10 px-6 text-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>

                                    {/* QR / App Actions */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <QrCode size={40} className="text-white/80" />
                                            <span className="text-white font-bold">Chụp mã đơn</span>
                                        </button>
                                        <button onClick={() => window.open('https://ego.app')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <Smartphone size={40} className="text-blue-400" />
                                            <span className="text-white font-bold">Tải Ego App</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <KioskButton fullWidth onClick={handleFinish} variant="primary">
                                        Hoàn tất
                                    </KioskButton>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { CaretLeft, Clock, Ticket, MapPin, VideoCamera, Images, Goggles, X } from '@phosphor-icons/react';
import { landmarkDetails } from '../../data/landmarks';
import HomeLayout from '../../layouts/HomeLayout';
import MapDirectionModal from '../../components/features/landmarks/MapDirectionModal';

export default function LandmarkDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const data = landmarkDetails[id || 'benthanh'] || landmarkDetails['benthanh'];

    const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');
    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [showMap, setShowMap] = useState(false);

    // Mini Map Preview URL
    // We can use a simpler static map or same embed for the preview card
    // Using a tight box around destination for preview
    const previewMinLat = data.lat - 0.002;
    const previewMaxLat = data.lat + 0.002;
    const previewMinLng = data.lng - 0.002;
    const previewMaxLng = data.lng + 0.002;
    const miniMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${previewMinLng},${previewMinLat},${previewMaxLng},${previewMaxLat}&layer=mapnik&marker=${data.lat},${data.lng}`;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <HomeLayout>
            <div className="h-full w-full flex flex-col bg-slate-900 overflow-hidden relative">

                {/* 1. HERO SECTION (Top 35%) */}
                <div className="h-[35%] relative w-full shrink-0 group">
                    {/* Back Button (Floating) */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-8 left-8 z-50 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-95 shadow-lg"
                    >
                        <CaretLeft size={32} weight="bold" className="text-white" />
                    </button>

                    <img
                        src={data.gallery[0]}
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col gap-2">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-6xl font-black text-white uppercase tracking-tighter drop-shadow-xl"
                        >
                            {data.title}
                        </motion.h1>
                        <div className="flex items-center gap-4 text-white/80">
                            <span className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                                <MapPin size={24} weight="fill" className="text-emerald-400" />
                                <span className="text-xl font-bold">{data.distance}</span>
                            </span>
                            <span className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-lg border border-orange-500/30">
                                <Clock size={24} weight="fill" className="text-orange-400" />
                                <span className="text-xl font-bold">{data.openHours}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. CONTENT SCROLLABLE (Middle) */}
                <div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {/* Description Card */}
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg">
                        <h3 className="text-2xl font-bold text-emerald-400 mb-4 uppercase flex items-center gap-2">
                            <Ticket size={28} weight="duotone" />
                            Giới thiệu
                        </h3>
                        <p className="text-2xl text-white/90 leading-relaxed font-light text-justify">
                            {data.longDescription}
                        </p>
                    </div>

                    {/* Gallery Section - Swipeable with Dots */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-blue-400 uppercase flex items-center gap-2">
                                <Images size={28} weight="duotone" />
                                Thư viện ảnh
                            </h3>
                            <span className="text-white/50 text-lg">{selectedPhoto + 1}/{data.gallery.length}</span>
                        </div>

                        {/* Swipeable Gallery */}
                        <div className="relative">
                            <motion.div
                                className="flex gap-4"
                                drag="x"
                                dragConstraints={{ left: -(data.gallery.length - 1) * 320, right: 0 }}
                                onDragEnd={(_, info) => {
                                    const threshold = 100;
                                    if (info.offset.x < -threshold && selectedPhoto < data.gallery.length - 1) {
                                        setSelectedPhoto(prev => prev + 1);
                                    } else if (info.offset.x > threshold && selectedPhoto > 0) {
                                        setSelectedPhoto(prev => prev - 1);
                                    }
                                }}
                                animate={{ x: -selectedPhoto * 320 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {data.gallery.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        className={`w-[300px] aspect-[4/3] shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${idx === selectedPhoto ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-white/10 opacity-60'
                                            }`}
                                        onClick={() => setSelectedPhoto(idx)}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Dot Indicators */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {data.gallery.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedPhoto(idx)}
                                    className={`transition-all rounded-full ${idx === selectedPhoto
                                        ? 'w-8 h-2 bg-blue-400'
                                        : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER ACTIONS (Bottom Fixed 15%) */}
                <div className="shrink-0 p-8 pt-4 bg-gradient-to-t from-slate-900 to-slate-900/90 z-20 flex gap-4 h-[15%] min-h-[140px]">
                    {/* Map Mini Card */}
                    <div
                        onClick={() => setShowMap(true)}
                        className="w-1/3 bg-slate-800 rounded-3xl overflow-hidden relative border border-white/10 group cursor-pointer"
                    >
                        {/* Mini Map Iframe */}
                        <iframe
                            src={miniMapUrl}
                            className="w-full h-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Mini Map"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                            <div className="bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2">
                                <MapPin size={24} className="text-red-500 animate-bounce" />
                                <span className="text-white font-bold text-lg">Xem Đường Đi</span>
                            </div>
                        </div>
                    </div>

                    {/* VR360 CTA - HUGE */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/vr360', { state: { image: data.vrUrl } })}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center gap-6 shadow-2xl shadow-purple-900/50 border border-white/20 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('https://t4.ftcdn.net/jpg/02/64/10/39/360_F_264103910_yRkk9k7g1k8g1k8g1k8g1k8g1k8.jpg')] opacity-20 bg-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
                        <Goggles size={56} weight="duotone" className="text-white z-10" />
                        <div className="flex flex-col items-start z-10">
                            <span className="text-lg text-purple-200 font-bold tracking-widest uppercase">Trải nghiệm thực tế ảo</span>
                            <span className="text-4xl font-black text-white">XEM VR360</span>
                        </div>
                    </motion.button>
                </div>

                {/* MAP MODAL COMPONENT */}
                <MapDirectionModal
                    isOpen={showMap}
                    onClose={() => setShowMap(false)}
                    destination={{
                        title: data.title,
                        lat: data.lat,
                        lng: data.lng
                    }}
                />

            </div>
        </HomeLayout>
    );
}

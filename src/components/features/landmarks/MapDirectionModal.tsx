import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, NavigationArrow, Spinner, PersonSimpleWalk, Coffee, ForkKnife, BuildingOffice, Storefront, MapPin, PaintBrush, ShoppingBag, Park, Bank, Buildings } from '@phosphor-icons/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import routeData from '../../../data/virtualTourRoute.json';

// Fix Leaflet Marker Icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Custom icons
const startIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const endIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const walkingIcon = L.divIcon({
    className: 'walking-marker',
    html: `
        <div style="
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            width: 40px; height: 40px; border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.6);
            display: flex; align-items: center; justify-content: center;
        ">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="white">
                <path d="M152,80a32,32,0,1,0-32-32A32,32,0,0,0,152,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,32Zm56,144a8,8,0,0,1-8,8H168.22l-19.57,44.87a8,8,0,0,1-14.63-1.19L110.14,168H72a8,8,0,0,1-7.37-11.12l32-76a8,8,0,0,1,14.74,6.24L82.14,152h28.69l20.37-48.31,20.8,32a8,8,0,0,0,6.69,3.6l.63,0,40-4a8,8,0,1,0-1.58-15.92l-34.14,3.41L144.18,92a8,8,0,0,0-13.15-1.11L96,131.09V104a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8h24.22l21.45,53.63L147.78,168H200A8,8,0,0,1,208,176Z"/>
            </svg>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

interface MapDirectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    destination: {
        title: string;
        lat: number;
        lng: number;
        routeGuide?: any[];
    };
    userLocation?: {
        title: string;
        lat: number;
        lng: number;
    };
}

// Get icon component by type
const getPoiIconComponent = (type: string, size = 20) => {
    const iconMap: Record<string, any> = {
        cafe: Coffee,
        restaurant: ForkKnife,
        hotel: BuildingOffice,
        market: Storefront,
        kiosk: MapPin,
        landmark: Buildings,
        gallery: PaintBrush,
        shopping: ShoppingBag,
    };
    const Icon = iconMap[type] || MapPin;
    return <Icon size={size} weight="fill" />;
};

// Get color by type
const getPoiColor = (type: string) => {
    return (routeData.poiTypes as any)[type]?.color || '#3b82f6';
};

export default function MapDirectionModal({ isOpen, onClose, destination, userLocation }: MapDirectionModalProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const walkingMarkerRef = useRef<L.Marker | null>(null);
    const animationRef = useRef<number | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentPoiIndex, setCurrentPoiIndex] = useState(0);
    const [speed, setSpeed] = useState(1); // 1x, 2x, 3x
    const [isPaused, setIsPaused] = useState(false);
    const speedRef = useRef(1);
    const isPausedRef = useRef(false);

    const pois = routeData.pois;
    const streets = routeData.route.streets;

    const startPoint = userLocation || {
        title: routeData.route.start.name,
        lat: routeData.route.start.lat,
        lng: routeData.route.start.lng
    };

    // Find current POI based on progress
    const findCurrentPoi = (progressPercent: number) => {
        let nearestIndex = 0;
        let minDiff = 100;
        pois.forEach((poi, index) => {
            const diff = Math.abs(poi.positionPercent - progressPercent);
            if (diff < minDiff) {
                minDiff = diff;
                nearestIndex = index;
            }
        });
        return nearestIndex;
    };

    // Sync refs with state
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    // Animation with progress tracking
    const startWalkingAnimation = (coordinates: L.LatLngExpression[]) => {
        if (!mapRef.current || coordinates.length < 2) return;

        if (walkingMarkerRef.current) walkingMarkerRef.current.remove();
        walkingMarkerRef.current = L.marker(coordinates[0] as L.LatLngTuple, { icon: walkingIcon }).addTo(mapRef.current);

        const baseDuration = 60000; // 60 seconds at 1x speed
        let lastTimestamp: number | null = null;
        let accumulatedProgress = 0;

        const distances: number[] = [0];
        let totalDistance = 0;
        for (let i = 1; i < coordinates.length; i++) {
            const from = L.latLng(coordinates[i - 1] as L.LatLngTuple);
            const to = L.latLng(coordinates[i] as L.LatLngTuple);
            totalDistance += from.distanceTo(to);
            distances.push(totalDistance);
        }

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Only advance if not paused
            if (!isPausedRef.current) {
                const progressDelta = (delta / baseDuration) * speedRef.current * 100;
                accumulatedProgress += progressDelta;

                // Loop when reaching end
                if (accumulatedProgress >= 100) accumulatedProgress = accumulatedProgress % 100;
            }

            setProgress(accumulatedProgress);
            setCurrentPoiIndex(findCurrentPoi(accumulatedProgress));

            const currentProgress = accumulatedProgress / 100;
            const targetDistance = currentProgress * totalDistance;
            let segmentIndex = 0;
            for (let i = 1; i < distances.length; i++) {
                if (distances[i] >= targetDistance) {
                    segmentIndex = i - 1;
                    break;
                }
            }

            const segmentStart = distances[segmentIndex];
            const segmentEnd = distances[segmentIndex + 1] || totalDistance;
            const segmentLength = segmentEnd - segmentStart;
            const segmentProgress = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 0;

            const fromCoord = coordinates[segmentIndex] as [number, number];
            const toCoord = coordinates[Math.min(segmentIndex + 1, coordinates.length - 1)] as [number, number];

            const lat = fromCoord[0] + (toCoord[0] - fromCoord[0]) * segmentProgress;
            const lng = fromCoord[1] + (toCoord[1] - fromCoord[1]) * segmentProgress;

            if (walkingMarkerRef.current) {
                walkingMarkerRef.current.setLatLng([lat, lng]);
            }

            animationRef.current = requestAnimationFrame(animate) as any;
        };

        animationRef.current = requestAnimationFrame(animate) as any;
    };

    const stopAnimation = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current as number);
            animationRef.current = null;
        }
        if (walkingMarkerRef.current) {
            walkingMarkerRef.current.remove();
            walkingMarkerRef.current = null;
        }
    };

    const fetchRoute = async () => {
        setIsLoading(true);
        try {
            const url = `https://router.project-osrm.org/route/v1/foot/${startPoint.lng},${startPoint.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes?.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression);

                if (mapRef.current) {
                    // Calculate split point for street colors (35% is where Nguyen Hue ends)
                    const splitIndex = Math.floor(coordinates.length * 0.35);
                    const nguyenHueCoords = coordinates.slice(0, splitIndex + 1);
                    const leLoiCoords = coordinates.slice(splitIndex);

                    // Draw Nguyen Hue (RED)
                    L.polyline(nguyenHueCoords, { color: '#7f1d1d', weight: 12, opacity: 0.3, lineJoin: 'round' }).addTo(mapRef.current);
                    L.polyline(nguyenHueCoords, { color: '#ef4444', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(mapRef.current);

                    // Draw Le Loi (BLUE)
                    L.polyline(leLoiCoords, { color: '#1e40af', weight: 12, opacity: 0.3, lineJoin: 'round' }).addTo(mapRef.current);
                    L.polyline(leLoiCoords, { color: '#3b82f6', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(mapRef.current);

                    // Add only LANDMARK markers on map (not restaurants/cafes)
                    pois.filter(poi => poi.type === 'landmark').forEach(poi => {
                        const color = getPoiColor(poi.type);
                        const poiMarker = L.divIcon({
                            className: 'poi-marker',
                            html: `<div style="background: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
                            iconSize: [18, 18],
                            iconAnchor: [9, 9],
                        });
                        L.marker([poi.lat, poi.lng], { icon: poiMarker }).addTo(mapRef.current!);
                    });

                    const bounds = L.latLngBounds(coordinates);
                    mapRef.current.fitBounds(bounds, { padding: [60, 60] });
                    startWalkingAnimation(coordinates);
                }

                setRouteInfo({
                    distance: `${(route.distance / 1000).toFixed(1)} km`,
                    duration: `${Math.round(route.duration / 60)} phút`
                });
            }
        } catch (error) {
            console.error('Failed to fetch route:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !mapContainerRef.current) return;

        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        stopAnimation();

        const map = L.map(mapContainerRef.current).setView([startPoint.lat, startPoint.lng], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map);
        L.marker([destination.lat, destination.lng], { icon: endIcon }).addTo(map);

        fetchRoute();

        return () => { stopAnimation(); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [isOpen]);

    const currentPoi = pois[currentPoiIndex];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                >
                    <div className="w-full h-full bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10 flex flex-col">
                        {/* Header */}
                        <div className="h-16 bg-slate-800/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-[1000] border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <NavigationArrow className="text-emerald-400" weight="fill" size={28} />
                                <div>
                                    Virtual Tour
                                    {routeInfo && (
                                        <span className="text-sm font-normal text-white/50 ml-3">
                                            <PersonSimpleWalk size={14} className="inline mr-1" />
                                            {routeInfo.distance} • {routeInfo.duration}
                                        </span>
                                    )}
                                </div>
                            </h2>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X size={28} className="text-white" />
                            </button>
                        </div>

                        {/* MAP */}
                        <div className="h-[45%] w-full relative bg-slate-100">
                            <div ref={mapContainerRef} className="w-full h-full" />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                    <Spinner size={40} className="text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* SCROLLABLE TIMELINE */}
                        <div className="h-36 bg-slate-800 border-y border-white/10 relative overflow-hidden">
                            {/* Scrollable content - moves left as progress increases */}
                            <motion.div
                                className="absolute inset-y-0 flex items-center"
                                style={{ width: '300%' }}
                                animate={{ x: `calc(25% - ${progress * 3}%)` }}
                                transition={{ duration: 0.3, ease: 'linear' }}
                            >
                                {/* Street labels at top */}
                                <div className="absolute top-2 left-0 flex" style={{ width: '100%' }}>
                                    {streets.map((street, i) => (
                                        <div
                                            key={i}
                                            className="text-xs font-bold uppercase tracking-wider text-center"
                                            style={{ width: `${street.endPercent - street.startPercent}%`, color: street.color }}
                                        >
                                            {street.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Timeline track - middle */}
                                <div className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-white/20 rounded-full" style={{ width: '100%' }}>
                                    {streets.map((street, i) => (
                                        <div
                                            key={i}
                                            className="absolute h-full rounded-full transition-opacity"
                                            style={{
                                                left: `${street.startPercent}%`,
                                                width: `${street.endPercent - street.startPercent}%`,
                                                background: street.color,
                                                opacity: progress >= street.startPercent ? 0.9 : 0.3
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* POI icons - position based on type */}
                                {pois.map((poi, i) => {
                                    const poiType = (routeData.poiTypes as any)[poi.type];
                                    const isTop = poiType?.position === 'top';

                                    return (
                                        <motion.div
                                            key={poi.id}
                                            className="absolute flex flex-col items-center"
                                            style={{
                                                left: `${poi.positionPercent}%`,
                                                top: isTop ? '20%' : '55%'
                                            }}
                                            animate={{ scale: i === currentPoiIndex ? 1.2 : 1 }}
                                        >
                                            {isTop ? (
                                                <>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i === currentPoiIndex ? 'ring-2 ring-white' : ''}`}
                                                        style={{ background: getPoiColor(poi.type) }}>
                                                        {getPoiIconComponent(poi.type, 12)}
                                                    </div>
                                                    <div className="w-px h-3" style={{ background: getPoiColor(poi.type), opacity: 0.7 }} />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-px h-3" style={{ background: getPoiColor(poi.type), opacity: 0.7 }} />
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i === currentPoiIndex ? 'ring-2 ring-white' : ''}`}
                                                        style={{ background: getPoiColor(poi.type) }}>
                                                        {getPoiIconComponent(poi.type, 12)}
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* Center indicator line */}
                            <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-purple-500/30" />
                            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-purple-500 shadow-lg z-10" />
                        </div>

                        {/* CURRENT POI - IMAGE FILLS REMAINING SPACE */}
                        <div
                            className="flex-1 relative overflow-hidden cursor-pointer"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {/* Full Background Image */}
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentPoi?.id}
                                    src={currentPoi?.images[0]}
                                    alt={currentPoi?.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: isPaused ? 1.05 : 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5 }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600';
                                    }}
                                />
                            </AnimatePresence>

                            {/* Gradient overlay - stronger when paused */}
                            <div className={`absolute inset-0 transition-all duration-300 ${isPaused ? 'bg-black/60' : 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'}`} />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                            {/* SPEED CONTROLS - Top Right */}
                            <div className="absolute top-4 right-4 flex gap-2 z-20" onClick={e => e.stopPropagation()}>
                                {[1, 2, 3].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSpeed(s)}
                                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${speed === s
                                            ? 'bg-purple-500 text-white shadow-lg'
                                            : 'bg-white/20 text-white/80 hover:bg-white/30'
                                            }`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>

                            {/* PAUSE INDICATOR */}
                            <AnimatePresence>
                                {isPaused && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-10 bg-white rounded-sm" />
                                                <div className="w-3 h-10 bg-white rounded-sm" />
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-center mt-3 text-sm">Nhấn để tiếp tục</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Glass Info Panel - Bottom (Expands when paused) */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 p-8"
                                animate={{ y: isPaused ? 0 : 0 }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${currentPoi?.id}-${isPaused}`}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                        className={`backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl transition-all ${isPaused ? 'max-w-4xl' : 'max-w-2xl'}`}
                                    >
                                        <div className="flex items-start gap-5">
                                            {/* Icon */}
                                            <div
                                                className={`rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all ${isPaused ? 'w-20 h-20' : 'w-16 h-16'}`}
                                                style={{ background: getPoiColor(currentPoi?.type || 'landmark') }}
                                            >
                                                {getPoiIconComponent(currentPoi?.type || 'landmark', isPaused ? 36 : 28)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Type badge */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span
                                                        className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                                                        style={{
                                                            background: `${getPoiColor(currentPoi?.type || 'landmark')}33`,
                                                            color: getPoiColor(currentPoi?.type || 'landmark')
                                                        }}
                                                    >
                                                        {(routeData.poiTypes as any)[currentPoi?.type]?.labelVi || 'Địa điểm'}
                                                    </span>
                                                    <span className="text-white/40 text-sm">
                                                        {currentPoiIndex + 1}/{pois.length} • {currentPoi?.street}
                                                    </span>
                                                </div>

                                                {/* Name */}
                                                <h3 className={`font-black text-white mb-2 leading-tight transition-all ${isPaused ? 'text-4xl' : 'text-3xl'}`}>
                                                    {currentPoi?.name}
                                                </h3>

                                                {/* Description - Full when paused */}
                                                <p className={`text-white/70 mb-4 transition-all ${isPaused ? 'text-xl' : 'text-lg line-clamp-2'}`}>
                                                    {currentPoi?.description}
                                                </p>

                                                {/* Extended info when paused */}
                                                {isPaused && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10"
                                                    >
                                                        <p className="text-white/60 text-base leading-relaxed">
                                                            📍 Vị trí: {currentPoi?.street} • Tọa độ: {currentPoi?.lat.toFixed(4)}, {currentPoi?.lng.toFixed(4)}
                                                        </p>
                                                    </motion.div>
                                                )}

                                                {/* Meta info */}
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    {currentPoi?.rating && (
                                                        <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-yellow-400">
                                                            ⭐ {currentPoi.rating}
                                                        </span>
                                                    )}
                                                    {currentPoi?.priceRange && (
                                                        <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-emerald-400">
                                                            {currentPoi.priceRange}
                                                        </span>
                                                    )}
                                                    {currentPoi?.openHours && (
                                                        <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-white/60">
                                                            🕐 {currentPoi.openHours}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import benthanhImg from '../../../assets/images/landmark/benthanh.png'
import notredameImg from '../../../assets/images/landmark/notredame.png'
import independenceImg from '../../../assets/images/landmark/independence.png'
import postofficeImg from '../../../assets/images/landmark/postoffice.png'
import nguyenhueImg from '../../../assets/images/landmark/nguyenhue.png'
import landmarkImg from '../../../assets/images/landmark/landmark.png'
import bitexcoImg from '../../../assets/images/landmark/bitexco.png'
import operaImg from '../../../assets/images/landmark/opera.png'
import bachdangImg from '../../../assets/images/landmark/bachdang.png'
import ngochoangImg from '../../../assets/images/landmark/ngochoang.png'

// Import all language landmark data
import landmarksVn from '../../../locales/landmarks/vn.json'
import landmarksEn from '../../../locales/landmarks/en.json'
import landmarksJp from '../../../locales/landmarks/jp.json'
import landmarksKr from '../../../locales/landmarks/kr.json'
import landmarksCn from '../../../locales/landmarks/cn.json'

// Map landmark images by ID
const landmarkImageMap: Record<string, string> = {
    benthanh: benthanhImg,
    notredame: notredameImg,
    independence: independenceImg,
    postoffice: postofficeImg,
    nguyenhue: nguyenhueImg,
    landmark81: landmarkImg,
    bitexco: bitexcoImg,
    opera: operaImg,
    bachdang: bachdangImg,
    ngochoang: ngochoangImg,
}

// Map language codes to landmark data
const landmarksDataMap: Record<string, typeof landmarksVn> = {
    vn: landmarksVn,
    en: landmarksEn,
    jp: landmarksJp,
    kr: landmarksKr,
    cn: landmarksCn,
}

export default function LandmarksCarousel() {
    const { i18n } = useTranslation()
    const navigate = useNavigate()

    // Get landmarks for current language
    const currentLandmarksData = landmarksDataMap[i18n.language] || landmarksVn
    const landmarks = currentLandmarksData.landmarks.slice(0, 5).map(item => ({
        id: item.id, // Pass ID
        image: landmarkImageMap[item.id] || benthanhImg,
        title: item.name,
        desc: item.description
    }))

    const [currentLandmarkIndex, setCurrentLandmarkIndex] = useState(0)

    // Auto-rotate every 5 seconds
    useEffect(() => {
        const rotateInterval = setInterval(() => {
            setCurrentLandmarkIndex((prev) => (prev + 1) % landmarks.length)
        }, 5000) // 5 seconds
        return () => clearInterval(rotateInterval)
    }, [landmarks.length])

    // Rotate images based on current index: [Previous, Current, Next]
    const getVisibleLandmarks = () => {
        const total = landmarks.length
        const prevIndex = (currentLandmarkIndex - 1 + total) % total
        const nextIndex = (currentLandmarkIndex + 1) % total
        return [
            { ...landmarks[prevIndex], index: prevIndex, position: 'prev' },
            { ...landmarks[currentLandmarkIndex], index: currentLandmarkIndex, position: 'current' },
            { ...landmarks[nextIndex], index: nextIndex, position: 'next' },
        ]
    }

    const handleLandmarkClick = (index: number) => {
        setCurrentLandmarkIndex(index)
    }

    const handleThumbnailWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        if (e.deltaY > 0) {
            setCurrentLandmarkIndex((prev) => (prev + 1) % landmarks.length)
        } else {
            setCurrentLandmarkIndex((prev) => (prev - 1 + landmarks.length) % landmarks.length)
        }
    }

    // Get 3 visible thumbnails
    const visibleThumbnails = getVisibleLandmarks()
    const currentLandmark = landmarks[currentLandmarkIndex]

    return (
        <section className="px-12 h-[var(--h-upper)] shrink-0">
            <div className="w-full h-full glass rounded-3xl relative overflow-hidden">
                {/* Full-width Background Image */}
                <motion.img
                    key={currentLandmarkIndex}
                    src={currentLandmark.image}
                    alt={currentLandmark.title}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => navigate(`/landmark/${currentLandmark.id}`)}
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Glass Info Panel - Bottom Left */}
                <div className="absolute bottom-0 left-0 right-[140px] p-6">
                    <motion.div
                        key={`info-${currentLandmarkIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 shadow-2xl"
                    >
                        <motion.h2
                            key={`title-${currentLandmarkIndex}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-4xl font-black text-white leading-tight mb-2"
                        >
                            {currentLandmark.title}
                        </motion.h2>
                        <motion.p
                            key={`desc-${currentLandmarkIndex}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="text-xl text-white/80 leading-relaxed line-clamp-2"
                        >
                            {currentLandmark.desc}
                        </motion.p>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-sm text-white/50 bg-white/10 px-3 py-1 rounded-full">
                                {currentLandmarkIndex + 1}/{landmarks.length}
                            </span>
                            <span className="text-sm text-emerald-400 font-medium">
                                CHẠM ĐỂ XEM CHI TIẾT →
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Vertical Thumbnails */}
                <div
                    className="absolute right-4 top-4 bottom-4 w-[100px] flex flex-col gap-3 overflow-hidden"
                    onWheel={handleThumbnailWheel}
                >
                    {visibleThumbnails.map((landmark) => (
                        <motion.div
                            key={landmark.index}
                            onClick={() => handleLandmarkClick(landmark.index)}
                            className={`flex-1 cursor-pointer rounded-xl overflow-hidden ${landmark.index === currentLandmarkIndex ? 'ring-3 ring-emerald-400 shadow-lg' : 'opacity-60 hover:opacity-100'
                                } transition-all`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <img
                                src={landmark.image}
                                alt={landmark.title}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

import { useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

interface PanoramaViewerProps {
    image: string;
    onClose?: () => void;
}

const PanoramaViewer = ({ image, onClose }: PanoramaViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        console.log('[PanoramaViewer] Initializing with image:', image);

        if (containerRef.current && !viewerRef.current) {
            try {
                viewerRef.current = new Viewer({
                    container: containerRef.current,
                    panorama: image,
                    caption: 'Hồ Chí Minh City 360° View',
                    loadingTxt: 'Loading Panorama...',
                    touchmoveTwoFingers: false,
                    mousewheel: true,
                    navbar: [
                        'zoom',
                        'caption',
                        'fullscreen',
                    ],
                });

                console.log('[PanoramaViewer] Viewer created successfully');
            } catch (error) {
                console.error('[PanoramaViewer] Error creating viewer:', error);
            }
        }

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [image]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header with Back button */}
            <div className="absolute top-0 left-0 right-0 z-[110] p-8 flex justify-between items-center pointer-events-none">
                <button
                    onClick={onClose}
                    className="pointer-events-auto flex items-center gap-4 px-8 py-4 bg-black/60 hover:bg-black/80 text-white rounded-2xl backdrop-blur-xl transition-all border border-white/20 active:scale-95 shadow-2xl"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                    <span className="text-2xl font-bold">Quay lại</span>
                </button>
                <div className="pointer-events-none bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                    <span className="text-white/80 font-medium tracking-widest uppercase text-sm">Interactive 360° Experience</span>
                </div>
            </div>

            {/* Viewer Container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Interaction Hint */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-[110] animate-bounce">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#fbbf24" viewBox="0 0 256 256">
                        <path d="M220.24,103.76l-48-48a6,6,0,0,0-8.48,8.48L205.51,106H50.49l41.75-41.76a6,6,0,0,0-8.48-8.48l-48,48a6,6,0,0,0,0,8.48l48,48a6,6,0,0,0,8.48-8.48L50.49,118H205.51l-41.75,41.76a6,6,0,1,0,8.48,8.48l48-48A6,6,0,0,0,220.24,103.76Z"></path>
                    </svg>
                    <span className="text-white text-sm font-medium">Vuốt để xoay 360°</span>
                </div>
            </div>
        </div>
    );
};

export default PanoramaViewer;

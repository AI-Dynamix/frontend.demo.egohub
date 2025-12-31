import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    IdentificationCard,
    Camera,
    CheckCircle,
    Warning,
    ArrowLeft,
    Scan,
    Eye,
    Fingerprint,
    User,
    Calendar,
    Globe,
    CreditCard
} from '@phosphor-icons/react'
import EngineeringDetailHeader from '../../components/kiosk/EngineeringDetailHeader'
import { aiRunner } from '../../services/ai-runner/AIRunnerService'
import { passportFullOCR } from '../../services/PassportFullOCRService'
import type { ScanDebugData, PassportData } from '../../services/PassportTypes'

interface PassportScanScreenProps {
    onBack: () => void
}

type ScanStatus = 'idle' | 'searching' | 'capturing' | 'decoding' | 'completed' | 'error'

export default function PassportScanScreen({ onBack }: PassportScanScreenProps) {
    const [status, setStatus] = useState<ScanStatus>('searching')
    const [passportData, setPassportData] = useState<PassportData | null>(null)
    const [flashActive, setFlashActive] = useState(false)
    const [debugLog, setDebugLog] = useState<string[]>([])
    const [lastDebugData, setLastDebugData] = useState<ScanDebugData | null>(null)
    const [camResolution, setCamResolution] = useState<string>('0x0')

    const addLog = (msg: string) => {
        console.log(`[PassportUI] ${msg}`)
        setDebugLog(prev => [msg, ...prev].slice(0, 10))
    }

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const scanInterval = useRef<NodeJS.Timeout | null>(null)

    // Camera Init
    useEffect(() => {
        // Ensure Service is loaded (idempotent)
        aiRunner.load();

        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                addLog('Requesting Camera...')
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: 'user'
                    }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // Wait for metadata to load to get dimensions
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            const res = `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`;
                            setCamResolution(res);
                            addLog(`Camera Active: ${res}`);
                            videoRef.current.play().catch(e => addLog(`Play Error: ${e.message}`));
                        }
                    };
                }
            } catch (err: any) {
                console.error("Camera Error", err);
                addLog(`Camera Error: ${err.message}`)
                setStatus('error');
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
            stopScanning();
        };
    }, []);

    // Scanning Loop
    useEffect(() => {
        if (status === 'searching') {
            startScanning();
        } else {
            stopScanning();
        }
    }, [status]);

    // --- NEW: MODE TOGGLE ---
    const [useFullMode, setUseFullMode] = useState(false);

    const manualCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            addLog('Video not ready for capture');
            return;
        }

        addLog('Capturing Frame...');

        // Capture frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        setStatus('decoding');
        // addLog('Sending to OCR...');

        try {
            // 1. Always Run Scan MRZ First (Background Worker)
            const result = await aiRunner.scanPassport(canvas);

            // Always update debug view
            setLastDebugData(result.debug);

            if (result.data) {

                // If Full Mode active, do extra verification
                if (useFullMode) {
                    addLog('MRZ Found. Verifying Visual Zone...');
                    setStatus('verifying' as any); // Using 'verifying' purely visual? Or need types?
                    // Cast for now as 'decoding' or keep 'decoding'

                    // 2. Run Full Page OCR on the SAME canvas
                    const visualData = await passportFullOCR.scanFullPage(canvas);
                    if (visualData) {
                        addLog(`Visual Data: ${visualData.fullName || 'N/A'}`);
                        // 3. Reconcile
                        const finalData = passportFullOCR.reconcileData(result.data, visualData);

                        addLog('Verification Complete.');
                        handleScanSuccess(finalData);
                    } else {
                        addLog('Visual Scan Failed. Using MRZ.');
                        handleScanSuccess(result.data);
                    }

                } else {
                    addLog('Scan Success!');
                    handleScanSuccess(result.data);
                }

            } else {
                // addLog('Scan Failed / No MRZ Found');
                setStatus('searching');
            }
        } catch (e: any) {
            addLog(`OCR Error: ${e.message}`);
            setStatus('searching');
        }
    }

    const startScanning = () => {
        if (scanInterval.current) return;
        addLog('Auto-Scan Started');

        scanInterval.current = setInterval(async () => {
            // Only auto-capture if status is strictly 'searching'
            if (status === 'searching') {
                await manualCapture();
            }
        }, 2000); // Slower interval to debug (2s)
    };

    const stopScanning = () => {
        if (scanInterval.current) {
            clearInterval(scanInterval.current);
            scanInterval.current = null;
        }
    };

    const handleScanSuccess = (data: PassportData) => {
        stopScanning();
        // Flash Effect
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 150);

        setPassportData(data);
        setStatus('completed');
    };

    const resetScan = () => {
        setPassportData(null);
        setStatus('searching');
        startScanning();
    };

    const [isMirrored, setIsMirrored] = useState(false) // Default false (Normal)

    const handleCopyImage = async (base64: string) => {
        if (!base64) return;
        try {
            // Create an image to draw on canvas
            const img = new Image();
            img.src = base64;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);

            // Convert to PNG (Clipboard API requires PNG)
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    addLog('📸 Image Copied!');
                } catch (err) {
                    console.error('Clipboard write failed', err);
                    addLog('❌ Copy Failed');
                }
            }, 'image/png');

        } catch (e) {
            console.error('Copy failed', e);
            addLog('❌ Copy Error');
        }
    };

    return (
        <div className="h-full bg-slate-950 text-white overflow-hidden grid grid-cols-8 grid-rows-[repeat(64,minmax(0,1fr))] p-4 gap-y-0 gap-x-8">

            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header (4h) */}
            <div className="row-start-1 row-end-5 col-span-8">
                <EngineeringDetailHeader
                    title="Passport MRZ Reader"
                    subtitle="PADDLEOCR • ONNX RUNTIME"
                    icon={IdentificationCard}
                    onBack={onBack}
                    rightElement={
                        <div className="flex gap-2 items-center">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsMirrored(!isMirrored)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${isMirrored ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                {isMirrored ? 'MIRRORED' : 'NORMAL'}
                            </motion.button>

                            {/* Full Page Mode Toggle */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setUseFullMode(!useFullMode)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${useFullMode ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                FULL PAGE CHECK: {useFullMode ? 'ON' : 'OFF'}
                            </motion.button>

                            {/* Scan Control Buttons */}
                            {status === 'searching' && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStatus('idle')}
                                    className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-500/40 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                    STOP SCAN
                                </motion.button>
                            )}
                            {(status === 'idle' || status === 'error') && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStatus('searching')}
                                    className="px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                >
                                    RESUME SCAN
                                </motion.button>
                            )}

                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                                status === 'decoding' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                                    status === 'idle' ? 'bg-slate-500/20 border-slate-500/40 text-slate-400' :
                                        'bg-blue-500/20 border-blue-500/40 text-blue-400'
                                }`}>
                                {status.toUpperCase()}
                            </span>
                        </div>
                    }
                />
            </div>

            {/* Camera View (30h) */}
            <div className="row-start-6 row-end-[36] col-span-8 bg-black rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl group">
                {/* Standard Video Element */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-80 transition-transform duration-500"
                    style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                    playsInline
                    muted
                    autoPlay
                />

                {/* MRZ Scan Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
                    {/* INFO OVERLAY */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1 z-50">
                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white/80 text-xs font-mono font-medium border border-white/10">
                            CAM: {camResolution}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-mono font-medium border border-white/10 ${status === 'searching' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            STATUS: {status.toUpperCase()}
                        </div>
                    </div>

                    {/* The Scan Slot */}
                    {/* w-[90%] (Widened) */}
                    {/* Shadow used for masking overlay: Bright center, Dark surroundings */}
                    <div className="relative w-[90%] h-[20%] top-[20%] border-2 border-white/30 rounded-3xl bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        {/* Slot Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

                        {/* Scanning Line */}
                        {(status === 'searching' || status === 'decoding') && (
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                                animate={{ top: ['10%', '90%', '10%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}

                        {/* Status Text in Slot */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <AnimatePresence mode="wait">
                                {status === 'searching' && (
                                    <motion.div
                                        key="searching"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center"
                                    >
                                        <Scan size={32} className="text-white/50 mb-2 animate-pulse" />
                                        <p className="text-white/60 text-sm font-medium tracking-widest uppercase">Align MRZ line here</p>
                                    </motion.div>
                                )}
                                {status === 'decoding' && (
                                    <motion.div
                                        key="decoding"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="w-8 h-8 border-t-2 border-white/50 rounded-full animate-spin mb-2" />
                                        <p className="text-blue-400 text-sm font-bold tracking-widest uppercase">Processing...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Instruction Label */}
                    <p className="mt-8 text-white/40 text-xs font-mono uppercase tracking-[0.3em]">
                        Hold passport steady • System will auto-capture
                    </p>
                </div>

                {/* Flash Effect */}
                <AnimatePresence>
                    {flashActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white z-[100]"
                        />
                    )}
                </AnimatePresence>

                {/* Results Overlay (Partial) */}
                {status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                                <CheckCircle size={48} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white">SCAN SUCCESSFUL</h2>
                            <p className="text-white/50 text-sm">Review identified information below</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Results Panel (24h) */}
            {/* Rows 38-61. (End 62) */}
            <div className="row-start-[38] row-end-[62] col-span-8 bg-slate-900/60 rounded-[2.5rem] border border-white/10 p-8 shadow-inner overflow-hidden flex flex-col">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <IdentificationCard size={28} className="text-blue-400" />
                    <h3 className="text-lg font-bold uppercase tracking-wider">Passport Information</h3>
                    <div className="ml-auto flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => manualCapture()}
                            className="px-4 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-colors"
                        >
                            CAPTURE
                        </motion.button>
                        {status === 'completed' && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={resetScan}
                                className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                            >
                                RE-SCAN
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-6">
                    {/* Columns of data */}
                    <div className="space-y-6">
                        <DataField icon={User} label="Full Name" value={passportData?.fullName} status={status} />
                        <DataField icon={CreditCard} label="Passport Number" value={passportData?.passportNumber} status={status} />
                        <DataField icon={Globe} label="Nationality" value={passportData?.nationality} status={status} />
                        <DataField icon={Calendar} label="Date of Birth" value={passportData?.dob} status={status} />
                    </div>
                    <div className="space-y-6">
                        <DataField icon={Eye} label="Gender" value={passportData?.gender} status={status} />
                        <DataField icon={Calendar} label="Expiry Date" value={passportData?.expiryDate} status={status} />
                        <DataField icon={Globe} label="Issuing Country" value={passportData?.issuingCountry} status={status} />
                        <DataField icon={Fingerprint} label="Biometric Status" value={passportData ? "ACTIVE" : null} status={status} />
                    </div>
                </div>

                {/* Raw MRZ */}
                {status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-white/5"
                    >
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Machine Readable Zone (MRZ)</p>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <p className="font-mono text-emerald-400/80 text-xs leading-relaxed tracking-[0.2em] whitespace-pre break-all">
                                {passportData?.mrzRaw}
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Grid Footer - System Info */}
            <div className='row-start-[64] row-end-[65] col-span-8 w-full flex justify-center items-center'>
                <span className="text-[10px] text-white/10 font-mono tracking-[0.2em] font-light">
                    KINETIC OPTICS v2 • {status.toUpperCase()} • ONNX
                </span>
            </div>

            {/* Debug: AI Crop View */}
            {lastDebugData?.cropImage && (
                <div onClick={(e) => { e.stopPropagation(); handleCopyImage(lastDebugData.cropImage!); }} className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 border border-yellow-500/50 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 w-[1000px] cursor-pointer hover:scale-110 transition-transform active:scale-95 origin-bottom" title="Click Crop to Copy">
                    <p className="text-[12px] text-yellow-400 font-mono uppercase tracking-widest leading-none mb-1">AI CROP DEBUG (CLICK IMAGE TO COPY)</p>

                    {/* Validation Error Display */}
                    {lastDebugData.validationError && (
                        <div className="w-full bg-red-500/20 border border-red-500/50 rounded px-2 py-1 mb-2 text-center">
                            <p className="text-[10px] text-red-300 font-bold font-mono uppercase tracking-wider">{lastDebugData.validationError}</p>
                        </div>
                    )}

                    {/* Main Crop */}
                    <img src={lastDebugData.cropImage} alt="Crop Debug" className="w-full h-auto bg-white/10 rounded border border-white/20 rendering-pixelated mb-2" />

                    {/* Split Lines Details */}
                    {(lastDebugData.line1FromModel || lastDebugData.line2FromModel) && (
                        <div className="bg-black/50 p-2 rounded w-full flex flex-col gap-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                            {/* Line 1 */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    {lastDebugData.line1Image &&
                                        <img
                                            src={lastDebugData.line1Image}
                                            onClick={(e) => { e.stopPropagation(); handleCopyImage(lastDebugData.line1Image!); }}
                                            className="h-10 object-contain bg-white/5 self-start border border-white/10 cursor-pointer hover:border-yellow-400 transition-colors"
                                            title="Click Line 1 to Copy"
                                        />
                                    }
                                    <span className="text-[10px] text-white/50 font-mono">{lastDebugData.line1Size}</span>
                                </div>
                                <p className="font-mono text-xs text-white/90 leading-tight whitespace-pre tracking-widest bg-blue-900/20 p-1">{lastDebugData.line1FromModel}</p>
                            </div>

                            {/* Line 2 */}
                            <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
                                <div className="flex items-center justify-between">
                                    {lastDebugData.line2Image &&
                                        <img
                                            src={lastDebugData.line2Image}
                                            onClick={(e) => { e.stopPropagation(); handleCopyImage(lastDebugData.line2Image!); }}
                                            className="h-10 object-contain bg-white/5 self-start border border-white/10 cursor-pointer hover:border-yellow-400 transition-colors"
                                            title="Click Line 2 to Copy"
                                        />
                                    }
                                    <span className="text-[10px] text-white/50 font-mono">{lastDebugData.line2Size}</span>
                                </div>
                                <p className="font-mono text-xs text-white/90 leading-tight whitespace-pre tracking-widest bg-blue-900/20 p-1">{lastDebugData.line2FromModel}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function DataField({ icon: Icon, label, value, status }: { icon: any, label: string, value: string | null | undefined, status: ScanStatus }) {
    const isLoading = status === 'decoding' || status === 'capturing'

    return (
        <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${value ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                <Icon size={20} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-0.5">{label}</p>
                {isLoading ? (
                    <div className="h-5 w-2/3 bg-white/5 rounded-md animate-pulse mt-1" />
                ) : (
                    <p className={`text-base font-bold ${value ? 'text-white' : 'text-white/10 font-mono italic'}`}>
                        {value || 'WAITING...'}
                    </p>
                )}
            </div>
        </div>
    )
}

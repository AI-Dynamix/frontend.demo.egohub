import { useState, useRef, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../../common/ui/button"
import { Slider } from "../../common/ui/slider"
import { X, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Check, Crop as CropIcon } from "lucide-react"
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageEditDialogProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onSave: (editedImageUrl: string) => void;
    title?: string;
}

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium leading-none ${className}`}>
        {children}
    </label>
)

export function ImageEditDialog({ isOpen, imageUrl, onClose, onSave, title = "Edit Image" }: ImageEditDialogProps) {
    useTranslation()

    // Image State
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [threshold, setThreshold] = useState(10)
    const [zoom, setZoom] = useState(1)
    const [selectedColor, setSelectedColor] = useState<{ r: number, g: number, b: number } | null>(null)

    // Crop State
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [isCropping, setIsCropping] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    // Undo/Redo history
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Initialize when dialog opens
    useEffect(() => {
        if (isOpen && imageUrl) {
            setOriginalImage(imageUrl)
            setProcessedImage(null)
            setSelectedColor(null)
            setHistory([])
            setHistoryIndex(-1)
            setZoom(1)
            setThreshold(10)
            setIsCropping(false)
        }
    }, [isOpen, imageUrl])

    // Crop functions
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, width, height),
            width,
            height,
        )
        setCrop(newCrop)
    }

    const applyCrop = () => {
        if (!completedCrop || !imgRef.current) return

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height

        canvas.width = completedCrop.width * scaleX
        canvas.height = completedCrop.height * scaleY

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0, canvas.width, canvas.height,
        )

        const newUrl = canvas.toDataURL('image/png')
        setOriginalImage(newUrl)
        setProcessedImage(null)
        setSelectedColor(null)
        setHistory([])
        setHistoryIndex(-1)
        setIsCropping(false)
    }

    // History functions
    const addToHistory = useCallback((imageUrl: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1)
            return [...newHistory, imageUrl]
        })
        setHistoryIndex(prev => prev + 1)
    }, [historyIndex])

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1)
            setProcessedImage(history[historyIndex - 1])
        } else if (historyIndex === 0) {
            setHistoryIndex(-1)
            setProcessedImage(null)
        }
    }

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1)
            setProcessedImage(history[historyIndex + 1])
        }
    }

    // Remove Background functions
    const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        if (!originalImage) return

        const img = e.currentTarget
        const rect = img.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) * (img.naturalWidth / rect.width))
        const y = Math.floor((e.clientY - rect.top) * (img.naturalHeight / rect.height))

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        const tempImg = new Image()
        tempImg.crossOrigin = "anonymous"
        tempImg.onload = () => {
            canvas.width = tempImg.naturalWidth
            canvas.height = tempImg.naturalHeight
            ctx.drawImage(tempImg, 0, 0)

            const pixel = ctx.getImageData(x, y, 1, 1).data
            const color = { r: pixel[0], g: pixel[1], b: pixel[2] }
            setSelectedColor(color)
            processRemoveBackground(tempImg, color, threshold)
        }
        tempImg.src = originalImage
    }, [originalImage, threshold])

    const processRemoveBackground = useCallback((img: HTMLImageElement, color: { r: number, g: number, b: number }, thresh: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const tolerance = thresh * 2.55

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const dist = Math.sqrt(
                Math.pow(r - color.r, 2) +
                Math.pow(g - color.g, 2) +
                Math.pow(b - color.b, 2)
            )

            if (dist <= tolerance) {
                data[i + 3] = 0
            }
        }

        ctx.putImageData(imageData, 0, 0)
        const resultUrl = canvas.toDataURL('image/png')
        setProcessedImage(resultUrl)
        addToHistory(resultUrl)
    }, [addToHistory])

    const handleThresholdChange = (value: number[]) => {
        setThreshold(value[0])

        if (originalImage && selectedColor) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                processRemoveBackground(img, selectedColor, value[0])
            }
            img.src = originalImage
        }
    }

    const handleSave = () => {
        const imageToSave = processedImage || originalImage
        if (imageToSave) {
            onSave(imageToSave)
        }
    }

    const checkerboardStyle = {
        backgroundImage: `
            linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
            linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
        `,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        backgroundColor: '#f5f5f5'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="grid md:grid-cols-[1fr,280px] gap-4">
                        {/* Image Preview */}
                        <div className="space-y-3">
                            <div
                                className="rounded-xl border overflow-hidden min-h-[300px] flex items-center justify-center"
                                style={checkerboardStyle}
                            >
                                {isCropping ? (
                                    <div className="p-4">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                        >
                                            <img
                                                ref={imgRef}
                                                src={originalImage || ''}
                                                alt="Crop"
                                                className="max-h-[50vh] object-contain"
                                                onLoad={onImageLoad}
                                            />
                                        </ReactCrop>
                                    </div>
                                ) : (
                                    <img
                                        src={processedImage || originalImage || ''}
                                        alt="Preview"
                                        className="object-contain cursor-crosshair max-h-[50vh] transition-transform"
                                        style={{ transform: `scale(${zoom})` }}
                                        onClick={handleImageClick}
                                    />
                                )}
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex < 0}>
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                                    <Redo2 className="h-4 w-4" />
                                </Button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

                                {isCropping ? (
                                    <>
                                        <Button size="sm" onClick={applyCrop} className="bg-green-600 hover:bg-green-700 text-white">
                                            <Check className="h-4 w-4 mr-1" /> Apply
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsCropping(false)} className="text-red-500">
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsCropping(true)}
                                        disabled={!originalImage}
                                    >
                                        <CropIcon className="h-4 w-4 mr-1" /> Crop
                                    </Button>
                                )}

                                <div className="flex-1" />

                                <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                                <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setZoom(1)} disabled={zoom === 1}>
                                    <Maximize className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Click</strong> on the image to select a color to remove.
                                </p>

                                {selectedColor && (
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                                        <div
                                            className="w-8 h-8 rounded border"
                                            style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
                                        />
                                        <div>
                                            <Label className="text-xs text-gray-500">Selected Color</Label>
                                            <p className="text-xs font-mono">RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Tolerance</Label>
                                        <span className="text-sm font-bold text-blue-600">{threshold}%</span>
                                    </div>
                                    <Slider
                                        value={[threshold]}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onValueChange={handleThresholdChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="brand"
                        className="h-11 px-6 shadow-xl"
                    >
                        <Check className="mr-2 h-4 w-4" /> Apply Changes
                    </Button>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    )
}

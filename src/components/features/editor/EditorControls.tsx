import { useTranslation } from "react-i18next"
import { Button } from "../../common/ui/button"
import { Input } from "../../common/ui/input"
import { Slider } from "../../common/ui/slider"
import { RotateCw, Upload, Download, ZoomIn, ZoomOut, Wand2, Loader2, Camera } from "lucide-react"

interface EditorControlsProps {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: () => void;
    scale: number;
    setScale: (val: number) => void;
    rotation: number;
    setRotation: (val: number) => void;
    onRemoveBackground?: () => void;
    isRemovingBackground?: boolean;
    removeBackgroundProgress?: number;
    hasImage?: boolean;
    onCameraOpen?: () => void;
}

export function EditorControls({
    onUpload,
    onDownload,
    scale,
    setScale,
    rotation,
    setRotation,
    onRemoveBackground,
    isRemovingBackground = false,
    removeBackgroundProgress = 0,
    hasImage = false,
    onCameraOpen
}: EditorControlsProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-6 p-4 bg-card border rounded-lg shadow-sm">
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">{t('editor.step1')}</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 relative cursor-pointer" asChild>
                        <label>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('editor.chooseImage')}
                            <Input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={onUpload}
                            />
                        </label>
                    </Button>

                    {onCameraOpen && (
                        <Button
                            variant="outline"
                            className="flex-shrink-0"
                            onClick={onCameraOpen}
                            title={t('editor.camera') || "Camera"}
                        >
                            <Camera className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* AI Background Removal */}
                {hasImage && onRemoveBackground && (
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={onRemoveBackground}
                        disabled={isRemovingBackground}
                    >
                        {isRemovingBackground ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('editor.processing')} {removeBackgroundProgress}%
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {t('editor.removeBackground')}
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-sm">{t('editor.step2')}</h3>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center"><ZoomOut className="h-3 w-3 mr-1" /> {t('editor.zoomOut')}</span>
                        <span className="flex items-center">{t('editor.zoomIn')} <ZoomIn className="h-3 w-3 ml-1" /></span>
                    </div>
                    <Slider
                        defaultValue={[scale]}
                        min={0.1}
                        max={3}
                        step={0.05}
                        onValueChange={(vals: number[]) => setScale(vals[0])}
                    />
                </div>

                <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center"><RotateCw className="h-3 w-3 mr-1 -scale-x-100" /> -180°</span>
                        <span className="text-center font-medium">{rotation}°</span>
                        <span className="flex items-center">180° <RotateCw className="h-3 w-3 ml-1" /></span>
                    </div>
                    <Slider
                        value={[rotation]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={(vals: number[]) => setRotation(vals[0])}
                    />
                </div>
            </div>

            <div className="pt-4 border-t">
                <Button onClick={onDownload} className="w-full" size="lg" variant="brand">
                    <Download className="mr-2 h-4 w-4" /> {t('editor.downloadFrame')}
                </Button>
            </div>
        </div>
    )
}



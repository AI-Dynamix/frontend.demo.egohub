import { useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Upload, Clipboard } from "lucide-react"
import { Button } from "../ui/button"

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void
  title?: string
  subtitle?: string
  className?: string
  children?: React.ReactNode  // For additional content like frame gallery
}

export function ImageUploader({ 
  onImageSelect, 
  title, 
  subtitle,
  className = "",
  children 
}: ImageUploaderProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      onImageSelect(url)
    }
  }

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const url = URL.createObjectURL(file)
          onImageSelect(url)
          break
        }
      }
    }
  }, [onImageSelect])

  // Listen for paste events
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    backgroundColor: '#f5f5f5'
  }

  return (
    <div className={className}>
      <div 
        className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        style={checkerboardStyle}
      >
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-6 inline-block">
          <div className="mx-auto h-10 w-10 text-muted-foreground mb-3">
            <Upload className="h-full w-full" />
          </div>
          
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
          
          <Button size="lg" className="relative cursor-pointer mb-3">
            <input 
              type="file" 
              ref={fileInputRef}
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*" 
              onChange={handleUpload}
            />
            {t('editor.chooseImage')}
          </Button>
          
          {/* Paste hint */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clipboard className="h-4 w-4" />
            <span>{t('uploader.pasteHint')}</span>
          </div>
        </div>
      </div>
      
      {children}
      
      <input 
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={handleUpload}
      />
    </div>
  )
}

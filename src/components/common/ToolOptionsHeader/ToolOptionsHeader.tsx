import { useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Clipboard } from "lucide-react"
import { Button } from "../ui/button"

interface ToolOptionsHeaderProps {
  onImageSelect: (url: string) => void
  title?: string
  showPasteHint?: boolean
}

export function ToolOptionsHeader({ 
  onImageSelect, 
  title,
  showPasteHint = true 
}: ToolOptionsHeaderProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      onImageSelect(url)
    }
  }

  // Paste from clipboard
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

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title || t('editor.options')}</h2>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          {t('editor.chooseImage')}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload}
        />
      </div>
      {showPasteHint && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clipboard className="h-4 w-4" />
          <span>{t('uploader.pasteHint')}</span>
        </div>
      )}
    </>
  )
}

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseImageUploadOptions {
  onImageSelect?: (url: string) => void
  acceptedTypes?: string[]
}

interface UseImageUploadReturn {
  imageUrl: string | null
  setImageUrl: (url: string | null) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePaste: (e: ClipboardEvent) => void
  triggerUpload: () => void
  clearImage: () => void
  originalSize: { width: number; height: number }
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const { onImageSelect } = options
  
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = useCallback((url: string) => {
    setImageUrl(url)
    
    // Get original dimensions
    const img = new Image()
    img.onload = () => {
      setOriginalSize({ width: img.width, height: img.height })
    }
    img.src = url
    
    onImageSelect?.(url)
  }, [onImageSelect])

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      handleImageSelect(url)
    }
  }, [handleImageSelect])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const url = URL.createObjectURL(file)
          handleImageSelect(url)
          break
        }
      }
    }
  }, [handleImageSelect])

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearImage = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setImageUrl(null)
    setOriginalSize({ width: 0, height: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [imageUrl])

  // Setup paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [])

  return {
    imageUrl,
    setImageUrl,
    fileInputRef,
    handleUpload,
    handlePaste,
    triggerUpload,
    clearImage,
    originalSize
  }
}

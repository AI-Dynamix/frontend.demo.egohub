import { useRef, useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "../ui/button"
import { createPortal } from "react-dom"

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className = ""
}: MobileBottomSheetProps) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // Small delay to allow render before animation
      setTimeout(() => setIsVisible(true), 10)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => setIsRendered(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isRendered) return null

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex items-end ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={`
          relative w-full bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-xl 
          transform transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{ 
          maxHeight: '85vh',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)' 
        }}
      >
        {/* Handle for dragging (visual only for now) */}
        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-400 hover:text-white -mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

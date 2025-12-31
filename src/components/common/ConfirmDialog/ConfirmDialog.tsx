import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning'
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isOpen])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }, [onCancel])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100'
    },
    warning: {
      icon: 'text-blue-500',
      button: 'brand',
      iconBg: 'bg-blue-100'
    },
    info: {
      icon: 'text-blue-500',
      button: 'brand',
      iconBg: 'bg-blue-100'
    }
  }

  const styles = variantStyles[variant]

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={dialogRef}
        tabIndex={-1}
        className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Header with gradient background */}
        <div className={`p-6 text-center ${variant === 'danger' ? 'bg-gradient-to-b from-red-50 to-transparent dark:from-red-950/20' : variant === 'warning' ? 'bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-950/20' : 'bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20'}`}>
          {/* Icon */}
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${styles.iconBg}`}>
            <AlertTriangle className={`h-7 w-7 ${styles.icon}`} />
          </div>
          
          {/* Title */}
          <h2 id="confirm-title" className="text-xl font-bold mb-2">
            {title || t('confirm.title')}
          </h2>
          
          {/* Message */}
          <p id="confirm-message" className="text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 bg-muted/30">
          <Button 
            variant="outline" 
            className="flex-1 h-11"
            onClick={onCancel}
          >
            {cancelText || t('confirm.cancel')}
          </Button>
          <Button 
            variant={styles.button === 'brand' ? 'brand' : 'default'}
            className="flex-1 h-11"
            onClick={onConfirm}
          >
            {confirmText || t('confirm.ok')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}


import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { Header } from '../../common/Header/Header'
import { Footer } from '../../common/Footer/Footer'
import { ImageUploader } from '../../common/ImageUploader/ImageUploader'
import { ConfirmDialog } from '../../common/ConfirmDialog/ConfirmDialog'
import { Button } from '../../common/ui/button'
import { cn } from '../../../utils/utils'
import { 
  Download, 
  Trash2, 
  Undo2, 
  Redo2, 
  Copy
} from 'lucide-react'

// Layout variants
const contentVariants = cva(
  "flex-1 bg-gray-50 dark:bg-gray-900",
  {
    variants: {
      layout: {
        sidebar: "flex",
        stacked: "flex flex-col"
      }
    },
    defaultVariants: {
      layout: "sidebar"
    }
  }
)

export interface ImageToolLayoutProps extends VariantProps<typeof contentVariants> {
  // Metadata
  title: string
  description?: string
  
  // Image state
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  
  // Feature flags
  features?: {
    upload?: boolean
    undo?: boolean
    redo?: boolean
    copy?: boolean
    download?: boolean
    clear?: boolean
  }
  
  // Callbacks
  onDownload?: () => void
  onClear?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCopy?: () => void
  
  // Undo/Redo state
  canUndo?: boolean
  canRedo?: boolean
  
  // Unsaved changes
  hasUnsavedChanges?: boolean
  
  // Render props
  renderEditor: (imageUrl: string) => ReactNode
  renderSidebar?: () => ReactNode
  renderToolbar?: () => ReactNode
  
  // File input ref (optional, for custom upload handling)
  fileInputRef?: React.RefObject<HTMLInputElement>
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  
  // Custom actions for header
  headerActions?: ReactNode
  
  // Additional class names
  className?: string
  editorClassName?: string
  sidebarClassName?: string
}

export function ImageToolLayout({
  title,
  description,
  imageUrl,
  onImageChange,
  features = {
    upload: true,
    download: true,
    clear: true
  },
  onDownload,
  onClear,
  onUndo,
  onRedo,
  onCopy,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
  renderEditor,
  renderSidebar,
  renderToolbar,
  fileInputRef,
  onUpload,
  headerActions,
  layout = "sidebar",
  className,
  editorClassName,
  sidebarClassName
}: ImageToolLayoutProps) {
  const { t } = useTranslation()

  // Navigation blocker for unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  )

  const handleClearWithConfirm = () => {
    if (onClear) {
      onClear()
    } else {
      onImageChange(null)
    }
  }

  // Default upload handler
  const handleDefaultUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      onImageChange(url)
    }
  }

  // Build action buttons
  const renderActionButtons = () => {
    const buttons = []

    if (features.undo && onUndo) {
      buttons.push(
        <Button
          key="undo"
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title={t('common.undo') || 'Undo'}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )
    }

    if (features.redo && onRedo) {
      buttons.push(
        <Button
          key="redo"
          variant="outline"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title={t('common.redo') || 'Redo'}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      )
    }

    if (features.copy && onCopy) {
      buttons.push(
        <Button
          key="copy"
          variant="outline"
          size="icon"
          onClick={onCopy}
          disabled={!imageUrl}
          title={t('common.copy') || 'Copy'}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )
    }

    if (features.clear) {
      buttons.push(
        <Button
          key="clear"
          variant="outline"
          size="icon"
          onClick={handleClearWithConfirm}
          disabled={!imageUrl}
          title={t('common.clear') || 'Clear'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }

    if (features.download && onDownload) {
      buttons.push(
        <Button
          key="download"
          onClick={onDownload}
          disabled={!imageUrl}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('common.download') || 'Download'}
        </Button>
      )
    }

    return buttons
  }

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <Header />
      
      <main className={cn(contentVariants({ layout }))}>
        <div className="container py-8 flex-1">
          {/* Tool Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Upload State */}
          {!imageUrl && features.upload && (
            <div className="max-w-2xl mx-auto">
              <ImageUploader
                onImageSelect={(url) => onImageChange(url)}
              />
              {/* Hidden file input for custom handling */}
              {fileInputRef && (
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onUpload || handleDefaultUpload}
                />
              )}
            </div>
          )}

          {/* Editor State */}
          {imageUrl && (
            <div className={cn(
              layout === "sidebar" 
                ? "grid grid-cols-1 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-6"
            )}>
              {/* Editor Area */}
              <div className={cn(
                "lg:col-span-2",
                editorClassName
              )}>
                {/* Toolbar */}
                {renderToolbar && (
                  <div className="mb-4 flex items-center gap-2">
                    {renderToolbar()}
                  </div>
                )}
                
                {/* Main Editor */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  {renderEditor(imageUrl)}
                </div>
              </div>

              {/* Sidebar */}
              {renderSidebar && (
                <div className={cn(
                  "space-y-4",
                  sidebarClassName
                )}>
                  {renderSidebar()}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {headerActions}
                    {renderActionButtons()}
                  </div>
                </div>
              )}

              {/* If no sidebar, show actions below editor */}
              {!renderSidebar && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {headerActions}
                  {renderActionButtons()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Unsaved Changes Dialog */}
      {blocker.state === 'blocked' && (
        <ConfirmDialog
          isOpen={true}
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
          title={t('common.unsavedChanges') || 'Unsaved Changes'}
          message={t('common.unsavedChangesDesc') || 'You have unsaved changes. Are you sure you want to leave?'}
          confirmText={t('common.leave') || 'Leave'}
          cancelText={t('common.stay') || 'Stay'}
          variant="danger"
        />
      )}
    </div>
  )
}


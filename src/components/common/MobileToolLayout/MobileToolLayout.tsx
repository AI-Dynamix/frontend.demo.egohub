import type { ReactNode } from 'react'
import { ArrowLeft, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

interface MobileToolLayoutProps {
  title: string
  children?: ReactNode
  imageArea: ReactNode
  actionBar: ReactNode
  bottomSheet?: ReactNode
  onBack?: () => void
  showMenu?: boolean
  onMenuClick?: () => void
}

export function MobileToolLayout({
  title,
  imageArea,
  actionBar,
  bottomSheet,
  onBack,
  showMenu = false,
  onMenuClick
}: MobileToolLayoutProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Minimal Header */}
      <header 
        className="flex items-center justify-between px-3 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 z-50"
        style={{ 
          height: 'calc(48px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="text-white hover:bg-gray-700 -ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <h1 className="text-base font-semibold truncate flex-1 text-center px-2">
          {title}
        </h1>
        
        {showMenu ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="text-white hover:bg-gray-700 -mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10" /> // Spacer for centering
        )}
      </header>

      {/* Full-screen Image Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {imageArea}
        </div>
      </main>

      {/* Bottom Sheet (optional, for expanded options) */}
      {bottomSheet && (
        <div className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
          {bottomSheet}
        </div>
      )}

      {/* Fixed Action Bar */}
      <footer 
        className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="p-3">
          {actionBar}
        </div>
      </footer>
    </div>
  )
}

// Subcomponents for convenience
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '../../../utils/utils'

const mobileActionButtonVariants = cva(
  "flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95",
  {
    variants: {
      variant: {
        default: "text-gray-300 hover:text-white hover:bg-gray-700",
        primary: "bg-blue-600 text-white hover:bg-blue-500",
        danger: "text-red-400 hover:text-red-300 hover:bg-red-900/30",
      },
      size: {
        sm: "min-w-[36px] min-h-[36px]",
        default: "min-w-[44px] min-h-[44px]",
        lg: "min-w-[52px] min-h-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MobileActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof mobileActionButtonVariants> {
  icon: ReactNode
  label?: string
}

export function MobileActionButton({ 
  icon, 
  label, 
  onClick, 
  disabled = false,
  variant,
  size,
  className,
  ...props
}: MobileActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        mobileActionButtonVariants({ variant, size }),
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
      {...props}
    >
      {icon}
      {label && <span className="text-[10px] font-medium">{label}</span>}
    </button>
  )
}

// Status bar for showing info like dimensions
interface StatusBarProps {
  items: Array<{ label: string; value: string }>
}

export function MobileStatusBar({ items }: StatusBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-2 px-4 bg-gray-800/80 text-xs">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <span className="text-gray-400">{item.label}:</span>
          <span className="text-white font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

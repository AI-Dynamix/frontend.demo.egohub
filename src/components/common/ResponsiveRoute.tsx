import { type ComponentType, lazy, Suspense } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ResponsiveRouteProps {
  DesktopComponent: ComponentType
  MobileComponent: ComponentType
  breakpoint?: number
}

/**
 * Renders different components based on screen size.
 * Useful for serving optimized layouts for mobile vs desktop.
 */
export function ResponsiveRoute({ 
  DesktopComponent, 
  MobileComponent, 
  breakpoint = 768 
}: ResponsiveRouteProps) {
  const isMobile = useIsMobile(breakpoint)

  // Simple loading fallback
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  return (
    <Suspense fallback={<LoadingFallback />}>
      {isMobile ? <MobileComponent /> : <DesktopComponent />}
    </Suspense>
  )
}

/**
 * Factory function to create a responsive route element
 */
export function createResponsiveRoute(
  desktopImport: () => Promise<{ default: ComponentType }>,
  mobileImport: () => Promise<{ default: ComponentType }>,
  breakpoint = 768
) {
  const DesktopComponent = lazy(desktopImport)
  const MobileComponent = lazy(mobileImport)
  
  return () => (
    <ResponsiveRoute 
      DesktopComponent={DesktopComponent}
      MobileComponent={MobileComponent}
      breakpoint={breakpoint}
    />
  )
}

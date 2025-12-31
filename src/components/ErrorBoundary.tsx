import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component for Kiosk
 * Catches runtime errors and displays a fallback UI
 * Auto-recovers after 30 seconds to maintain kiosk uptime
 */
class ErrorBoundary extends Component<Props, State> {
    private recoveryTimeout: number | null = null
    private readonly RECOVERY_DELAY_MS = 30000 // 30 seconds

    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error)
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)

        this.setState({ errorInfo })

        // Log to external service if needed
        // logErrorToService(error, errorInfo)

        // Start auto-recovery timer
        this.startRecoveryTimer()
    }

    componentWillUnmount() {
        this.clearRecoveryTimer()
    }

    startRecoveryTimer = () => {
        this.clearRecoveryTimer()
        this.recoveryTimeout = window.setTimeout(() => {
            console.log('[ErrorBoundary] Auto-recovering...')
            this.handleRecover()
        }, this.RECOVERY_DELAY_MS)
    }

    clearRecoveryTimer = () => {
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout)
            this.recoveryTimeout = null
        }
    }

    handleRecover = () => {
        this.clearRecoveryTimer()
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
        // Optionally navigate to welcome
        window.location.href = '/welcome'
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
                    {/* Error Icon */}
                    <div className="mb-8 p-6 bg-red-500/20 rounded-full border border-red-500/30">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                            className="text-red-400"
                        >
                            <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
                        </svg>
                    </div>

                    {/* Error Message */}
                    <h1 className="text-3xl font-bold mb-4 text-center">
                        Đã xảy ra lỗi
                    </h1>
                    <p className="text-lg text-gray-400 mb-8 text-center max-w-md">
                        Hệ thống gặp sự cố. Vui lòng thử lại hoặc đợi hệ thống tự khôi phục.
                    </p>

                    {/* Error Details (Development only) */}
                    {import.meta.env.DEV && this.state.error && (
                        <div className="mb-8 p-4 bg-black/50 rounded-xl max-w-2xl w-full overflow-auto max-h-48 border border-white/10">
                            <p className="text-red-400 font-mono text-sm">
                                {this.state.error.toString()}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={this.handleRecover}
                            className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 text-lg"
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-lg"
                        >
                            Tải lại trang
                        </button>
                    </div>

                    {/* Auto Recovery Notice */}
                    <p className="mt-8 text-gray-500 text-sm animate-pulse">
                        Tự động khôi phục sau 30 giây...
                    </p>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary

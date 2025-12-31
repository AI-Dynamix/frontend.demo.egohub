import { type ReactNode, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../services/authService'
import PasswordModal from '../kiosk/PasswordModal'

interface ProtectedRouteProps {
    children: ReactNode
    redirectTo?: string
}

/**
 * ProtectedRoute wrapper for Engineering Mode
 * Shows password modal if not authenticated
 * Renders children when authenticated
 */
export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
    const { isEngineeringAuthenticated } = useAuthStore()
    const [showModal, setShowModal] = useState(!isEngineeringAuthenticated)

    const handleSuccess = () => {
        // Auth is already set in authenticate(), just close modal
        setShowModal(false)
    }

    const handleClose = () => {
        setShowModal(false)
    }

    // If authenticated, render children
    if (isEngineeringAuthenticated) {
        return <>{children}</>
    }

    // If modal is closed but not authenticated, redirect
    if (!showModal && !isEngineeringAuthenticated) {
        return <Navigate to={redirectTo} replace />
    }

    // Show password modal
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            <PasswordModal
                isOpen={showModal}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    )
}

import { create } from 'zustand'

const ENGINEERING_PASSWORD = '1122'

interface AuthState {
    isEngineeringAuthenticated: boolean
    authenticate: (password: string) => boolean
    logout: () => void
    checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initialize from sessionStorage
    isEngineeringAuthenticated: sessionStorage.getItem('engineering_auth') === 'true',

    authenticate: (password: string) => {
        if (password === ENGINEERING_PASSWORD) {
            sessionStorage.setItem('engineering_auth', 'true')
            set({ isEngineeringAuthenticated: true })
            return true
        }
        return false
    },

    logout: () => {
        sessionStorage.removeItem('engineering_auth')
        set({ isEngineeringAuthenticated: false })
    },

    checkAuth: () => {
        const isAuth = sessionStorage.getItem('engineering_auth') === 'true'
        if (isAuth !== get().isEngineeringAuthenticated) {
            set({ isEngineeringAuthenticated: isAuth })
        }
        return isAuth
    }
}))

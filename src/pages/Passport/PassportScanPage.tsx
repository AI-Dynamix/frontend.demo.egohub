import PassportScanScreen from '../Engineering/PassportScanScreen'
import { useNavigate } from 'react-router-dom'

export default function PassportScanPage() {
    const navigate = useNavigate()

    // Standalone wrapper
    // In a real route, onBack might lead to Home or previous page
    return (
        <div className="h-full w-full bg-black">
            <PassportScanScreen onBack={() => navigate('/')} />
        </div>
    )
}

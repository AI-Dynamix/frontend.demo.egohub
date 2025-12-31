import { useNavigate, useLocation } from 'react-router-dom'
import { PanoramaViewer } from '../../components/viewers'
import demoPanorama from '../../assets/demo.png'

/**
 * VR360Page - 360° Virtual Reality Experience
 */
export default function VR360Page() {
    const navigate = useNavigate()
    const location = useLocation()

    // Get image from State (navigate options) or use Default
    const panoramaImage = location.state?.image || demoPanorama

    return (
        <PanoramaViewer
            image={panoramaImage}
            onClose={() => navigate(-1)}
        />
    )
}

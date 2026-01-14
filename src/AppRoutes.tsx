import { createBrowserRouter, createRoutesFromElements, Route, Navigate, useOutletContext } from "react-router-dom"
import { lazy } from "react"
import Home from "./pages/Home/Home"
import BootPage from "./pages/Boot/BootPage"
import SupportPage from "./pages/Support/SupportPage"
import RootLayout from "./layouts/RootLayout"
import ProtectedRoute from "./components/common/ProtectedRoute"

// Lazy load pages
const Welcome = lazy(() => import('./pages/Welcome/Welcome'))
const EngineeringMode = lazy(() => import('./pages/Engineering/EngineeringMode'))
const PlannerPage = lazy(() => import('./pages/Planner/PlannerPage'))
const VR360Page = lazy(() => import('./pages/VR360/VR360Page'))
const PassportScanPage = lazy(() => import('./pages/Passport/PassportScanPage'))
const LandmarkDetailScreen = lazy(() => import('./pages/Features/LandmarkDetailScreen'))
const SearchPage = lazy(() => import('./pages/Search/SearchPage'))
const RestaurantSearch = lazy(() => import('./pages/Search/categories/RestaurantSearch'))
const HotelSearch = lazy(() => import('./pages/Search/categories/HotelSearch'))
const TicketSearch = lazy(() => import('./pages/Search/categories/TicketSearch'))
const TransportSearch = lazy(() => import('./pages/Search/categories/TransportSearch'))
const ShoppingSearch = lazy(() => import('./pages/Search/categories/ShoppingSearch'))
const SOSPage = lazy(() => import('./pages/SOS/SOSPage'))

// Context Type for Outlet
type KioskContextType = {
  isUserDetected: boolean;
}

export function useKiosk() {
  return useOutletContext<KioskContextType>()
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/boot" replace />} />
        <Route path="/boot" element={<BootPage />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/vr360" element={<VR360Page />} />
        <Route path="/passport" element={<PassportScanPage />} />
        <Route path="/landmark/:id" element={<LandmarkDetailScreen />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/dining" element={<RestaurantSearch />} />
        <Route path="/search/hotels" element={<HotelSearch />} />
        <Route path="/search/tickets" element={<TicketSearch />} />
        <Route path="/search/tickets" element={<TicketSearch />} />
        <Route path="/search/transport" element={<TransportSearch />} />
        <Route path="/search/shopping" element={<ShoppingSearch />} />
        <Route path="/sos" element={<SOSPage />} />
        <Route path="/engineering" element={
          <ProtectedRoute>
            <EngineeringMode />
          </ProtectedRoute>
        } />
      </Route>

      {/* Standalone Route for Planner to avoid RootLayout scaling */}
      <Route path="/planner" element={
        <ProtectedRoute>
          <PlannerPage />
        </ProtectedRoute>
      } />
    </>
  )
)

export default router

import { RouterProvider } from "react-router-dom"
import router from "./AppRoutes"
import { ThemeProvider } from "./context/ThemeContext"
import ErrorBoundary from "./components/ErrorBoundary"
import "./i18n"

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

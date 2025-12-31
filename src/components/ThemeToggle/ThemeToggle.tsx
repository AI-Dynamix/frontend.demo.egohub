import { Moon, Sun } from "lucide-react"
import { Button } from "../common/ui/button"
import { useTheme } from "../../context/ThemeContext"
// import { useTranslation } from "react-i18next"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

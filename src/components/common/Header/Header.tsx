import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { Button } from "../ui/button"
import { LanguageSwitcher } from "../../LanguageSwitcher/LanguageSwitcher"
import { ThemeToggle } from "../../ThemeToggle/ThemeToggle"
import { Menu, X, Search } from "lucide-react"

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/tools/remove-background", label: t('tools.removeBackground') },
    { href: "/tools/resize", label: t('tools.resizeImage') },
    { href: "/create", label: t('header.createFrame') },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group mr-6">
          <img src="/icon.png" alt="AloAI" className="h-8 w-8 object-contain rounded-full group-hover:scale-110 transition-transform duration-300 shadow-md" />
          <span className="font-bold text-xl logo-gradient-animate">
            AloAI
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              to={link.href} 
              className={`text-sm font-medium transition-colors ${
                isHome && !isScrolled 
                  ? "text-white/90 hover:text-white" 
                  : "text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t('common.search')}
              className="h-9 w-64 bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-full pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
            />
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className={isHome && !isScrolled ? "text-white" : "text-gray-600 dark:text-gray-300"}>
              {!isHome && <ThemeToggle />}
            </div>
            <div className={isHome && !isScrolled ? "text-white" : "text-gray-600 dark:text-gray-300"}>
              <LanguageSwitcher />
            </div>
            <Link to="/login">
              <Button variant="ghost" size="sm" className={isHome && !isScrolled ? "text-white hover:text-white hover:bg-white/20" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"}>{t('common.login')}</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden p-2 ${isHome && !isScrolled ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4 shadow-xl">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-500 font-medium p-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center justify-between gap-4 p-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between gap-4 p-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Language</span>
              <LanguageSwitcher />
            </div>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                {t('common.login')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

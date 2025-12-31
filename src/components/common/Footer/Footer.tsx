import { useTranslation } from "react-i18next"

export function Footer() {
    const { t } = useTranslation()

    return (
      <footer className="border-t border-gray-800/50 bg-gray-950">
        <div className="container py-10">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/icon.png" alt="AloAI" className="h-8 w-8 object-contain rounded-full shadow-lg border border-blue-500/20" />
                <span className="font-bold text-xl tracking-tight">
                  <span className="text-blue-500 hover:text-blue-400 transition-colors">Alo</span>
                  <span className="text-red-500 hover:text-red-400 transition-colors">AI</span>
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-5 text-blue-400 tracking-wider text-xs uppercase">{t('footer.quickLinks')}</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="/create" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" /> {t('header.createFrame')}</a></li>
                <li><a href="/tools/remove-background" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" /> {t('tools.removeBackground')}</a></li>
                <li><a href="/tools/resize" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" /> {t('tools.resizeImage')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-5 text-blue-400 tracking-wider text-xs uppercase">{t('footer.contact')}</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="flex flex-col gap-1">
                  <span className="text-blue-500 font-medium">{t('footer.hotline')}</span>
                  <p className="text-gray-600 text-xs">
                    {t('footer.company')}
                  </p>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-5 text-blue-400 tracking-wider text-xs uppercase">{t('footer.terms')}</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="/terms" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" /> {t('footer.terms')}</a></li>
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><div className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" /> {t('footer.privacy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <div>{t('footer.copyright')}</div>
            <div className="flex gap-6 uppercase tracking-widest font-medium">
               <span className="hover:text-blue-500 cursor-pointer transition-colors">Facebook</span>
            </div>
          </div>
        </div>
      </footer>
    )
  }

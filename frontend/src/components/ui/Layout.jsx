// src/components/ui/Layout.jsx
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBackendHealth } from '../../hooks/useBackendHealth.js';
import { BackendBanner } from './BackendBanner.jsx';

export default function Layout({ children }) {
  const { isHealthy, isChecking } = useBackendHealth();
  const { t, i18n } = useTranslation();

  const navLinks = [
    { to: '/',             label: t('nav.dashboard'),   icon: '📊' },
    { to: '/ranking',      label: t('nav.ranking'),     icon: '🏆' },
    { to: '/map',          label: t('nav.map'),         icon: '🗺️'  },
    { to: '/about-sensors',label: t('nav.sensors'),    icon: '📡' },
    { to: '/about-icaud',  label: t('nav.howItWorks'), icon: '❓' },
  ];

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'pt' : 'en');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-display">
      <BackendBanner isHealthy={isHealthy} isChecking={isChecking} />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">🌿</div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">EcoSense</span>
              <span className="hidden sm:block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{t('nav.platform')}</span>
            </Link>

            <div className="flex items-center gap-1">
              <nav className="flex items-center gap-1">
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span>{link.icon}</span>
                    <span className="hidden sm:inline">{link.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Language toggle */}
              <button
                onClick={toggleLang}
                title={i18n.language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
                className="ml-2 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
              >
                {i18n.language === 'en' ? '🇧🇷 PT' : '🇺🇸 EN'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t('footer.tagline')}</span>
            <span>{t('footer.index')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

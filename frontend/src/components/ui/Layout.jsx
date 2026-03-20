// src/components/ui/Layout.jsx
// App shell with navigation

import { Link, NavLink, useLocation } from 'react-router-dom';
import { useBackendHealth } from '../../hooks/useBackendHealth.js';
import { BackendBanner } from './BackendBanner.jsx';

const navLinks = [
  { to: '/',        label: 'Painel',    icon: '📊' },
  { to: '/ranking', label: 'Ranking',   icon: '🏆' },
  { to: '/map',     label: 'Mapa',      icon: '🗺️'  },
  { to: '/about-sensors', label: 'Sensores', icon: '📡' },
  { to: '/about-icaud', label: 'Como Funciona', icon: '❓' },
];

export default function Layout({ children }) {
  const { isHealthy, isChecking } = useBackendHealth();

  return (
    <div className="min-h-screen bg-gray-50 font-display">
      {/* Backend Status Banner */}
      <BackendBanner isHealthy={isHealthy} isChecking={isChecking} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">🌿</div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">EcoSense</span>
              <span className="hidden sm:block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Plataforma IoT</span>
            </Link>

            {/* Nav */}
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>EcoSense Plataforma IoT — Dados ambientais de Sensor.Community & Open-Meteo</span>
            <span>Índice ICAU-D</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

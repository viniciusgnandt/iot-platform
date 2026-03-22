// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/ui/Layout.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Ranking    from './pages/Ranking.jsx';
import MapPage    from './pages/MapPage.jsx';
import CityDetail from './pages/CityDetail.jsx';
import ICAUDExplainer from './pages/ICAUDExplainer.jsx';
import SensorExplainer from './pages/SensorExplainer.jsx';

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🌫️</div>
      <h2 className="text-2xl font-bold text-gray-700">{t('common.notFound')}</h2>
      <a href="/" className="mt-4 inline-block text-green-600 hover:underline">{t('common.backToDashboard')}</a>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />}  />
        <Route path="/ranking"       element={<Ranking />}    />
        <Route path="/map"           element={<MapPage />}    />
        <Route path="/cities/:city"  element={<CityDetail />} />
        <Route path="/about-icaud"   element={<ICAUDExplainer />} />
        <Route path="/about-sensors" element={<SensorExplainer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

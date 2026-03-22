// src/pages/CityDetail.jsx
// Detailed view for a single city

import { useParams, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useCity } from '../hooks/useEnvironmentalData.js';
import {
  ScoreRing, StatCard, ClassificationBadge, Spinner, ErrorAlert, EmptyState
} from '../components/ui/index.jsx';
import { CityMeasurementsChart } from '../components/charts/EnvironmentalChart.jsx';
import { formatMeasurement } from '../utils/icaud.js';
import { formatFullDateTimeBRT, formatRelativeTimeBRT } from '../utils/dateFormatter.js';

const SensorMap = lazy(() => import('../components/map/SensorMap.jsx'));

/** Detail row for ICAU-D component breakdown */
function ComponentRow({ label, value, weight, icon }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600 flex items-center gap-2">
        <span>{icon}</span>{label}
      </span>
      <div className="flex items-center gap-3">
        <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
        <span className="text-sm font-mono font-semibold text-gray-700 w-10 text-right">
          {value.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 w-10">×{(weight * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function CityDetail() {
  const { t } = useTranslation();
  const { city: cityParam } = useParams();
  const cityName = decodeURIComponent(cityParam);

  const { data: city, isLoading, error } = useCity(cityName);

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorAlert message={`'${cityName}' — ${t('common.noData')}`} />;
  if (!city) return <EmptyState message={`${t('common.noData')} — '${cityName}'`} />;

  const { icaud, measurements, measurementCounts, sensorCount, country } = city;
  const components = icaud?.components || {};
  const weights    = icaud?.weights    || {};

  // Build a fake sensor list centered on the city for the map
  const citySensor = city.sensorCount > 0 ? [{
    id: city.id,
    source: 'aggregated',
    name: city.name,
    location: { lat: city.location.lat, lon: city.location.lon, city: city.name },
    measurements,
    icaud,
    lastSeen: city.updatedAt,
  }] : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-green-600">{t('cityDetail.breadcrumbDashboard')}</Link>
        <span>/</span>
        <Link to="/ranking" className="hover:text-green-600">{t('cityDetail.breadcrumbRanking')}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{city.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{city.name}</h1>
            <p className="text-gray-500 mt-1">{country || t('cityDetail.unknownCountry')}</p>
            <div className="flex items-center gap-3 mt-3">
              {icaud?.classification && (
                <ClassificationBadge
                  label={t(`classifications.${icaud.classification.label}`, icaud.classification.label)}
                  color={icaud.classification.color}
                />
              )}
              <span className="text-xs text-gray-400">
                {t('cityDetail.activeSensors', { count: sensorCount, plural: sensorCount !== 1 ? 's' : '' })}
              </span>
            </div>
          </div>
          <ScoreRing score={icaud?.score} size={130} />
        </div>
      </div>

      {/* Measurements grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label={t('cityDetail.measurements.temperature')} value={measurements.temperature?.toFixed(1)} unit="°C"    icon="🌡️" color="#f59e0b" />
        <StatCard label={t('cityDetail.measurements.humidity')}    value={measurements.humidity?.toFixed(0)}     unit="%"     icon="💧" color="#3b82f6" />
        <StatCard label={t('cityDetail.measurements.pm25')}        value={measurements.pm25?.toFixed(1)}         unit="µg/m³" icon="🌫️" color="#8b5cf6" />
        <StatCard label={t('cityDetail.measurements.pm10')}        value={measurements.pm10?.toFixed(1)}         unit="µg/m³" icon="💨" color="#ec4899" />
        <StatCard label={t('cityDetail.measurements.windSpeed')}   value={measurements.windSpeed?.toFixed(1)}    unit="m/s"   icon="🌬️" color="#06b6d4" />
      </div>

      {/* ICAU-D breakdown + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICAU-D component breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">{t('cityDetail.icaudComposition')}</h2>
          <ComponentRow label={t('cityDetail.measurements.temperature')} value={components.temperature} weight={weights.temperature || 0} icon="🌡️" />
          <ComponentRow label={t('cityDetail.measurements.humidity')}    value={components.humidity}    weight={weights.humidity    || 0} icon="💧" />
          <ComponentRow label={t('cityDetail.measurements.pm25')}        value={components.airQuality}  weight={weights.airQuality  || 0} icon="🌫️" />
          <ComponentRow label={t('cityDetail.measurements.windSpeed')}   value={components.wind}        weight={weights.wind        || 0} icon="🌬️" />

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">{t('cityDetail.finalScore')}</span>
            <span className="text-xl font-bold font-mono" style={{ color: icaud?.classification?.color }}>
              {icaud?.score?.toFixed(1) || '—'}
            </span>
          </div>
        </div>

        {/* Measurements chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">{t('cityDetail.currentMeasurements')}</h2>
          <CityMeasurementsChart measurements={measurements} />
        </div>
      </div>

      {/* City map */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">{t('cityDetail.location')}</h2>
        <Suspense fallback={<Spinner />}>
          <SensorMap
            sensors={citySensor}
            center={[city.location.lat, city.location.lon]}
            zoom={11}
            height="300px"
          />
        </Suspense>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-400 text-right">
        <span title={formatFullDateTimeBRT(city.lastSeen || city.updatedAt) + ' (BRT)'} className="cursor-help">
          {t('cityDetail.lastReading', { relative: formatRelativeTimeBRT(city.lastSeen || city.updatedAt), full: formatFullDateTimeBRT(city.lastSeen || city.updatedAt) })}
        </span>
      </div>
    </div>
  );
}

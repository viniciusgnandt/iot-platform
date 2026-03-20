// src/pages/MapPage.jsx
// Full-page interactive sensor map

import { Suspense, lazy, useState } from 'react';
import { useSensors } from '../hooks/useEnvironmentalData.js';
import { Spinner, ErrorAlert } from '../components/ui/index.jsx';
import { MapLegend } from '../components/map/SensorMap.jsx';

const SensorMap = lazy(() => import('../components/map/SensorMap.jsx'));

const SOURCE_OPTIONS = [
  { value: '',                 label: 'Todas as Fontes' },
  { value: 'opensensemap',     label: 'OpenSenseMap' },
  { value: 'sensor_community', label: 'Sensor.Community' },
  { value: 'openweather',      label: 'OpenWeather' },
];

export default function MapPage() {
  const [source, setSource] = useState('');
  const { data: sensors = [], isLoading, error } = useSensors({ source: source || undefined, limit: 1000 });

  const filtered = source
    ? sensors.filter(s => s.source === source)
    : sensors;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Mapa de Sensores</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} sensores ativos exibidos
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SOURCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorAlert message="Failed to load sensor data" />}

      <div className="relative">
        <Suspense fallback={<Spinner />}>
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl border border-gray-200">
              <Spinner size="lg" />
            </div>
          ) : (
            <SensorMap sensors={filtered} height="600px" />
          )}
        </Suspense>

        {/* Legend overlay */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <MapLegend />
        </div>
      </div>

      {/* Source statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SOURCE_OPTIONS.slice(1).map(src => {
          const count = sensors.filter(s => s.source === src.value).length;
          return (
            <div key={src.value} className="bg-white rounded-lg border border-gray-100 p-3 text-center shadow-sm">
              <div className="text-2xl font-bold font-mono text-gray-700">{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{src.label}</div>
            </div>
          );
        })}
        <div className="bg-green-50 rounded-lg border border-green-100 p-3 text-center shadow-sm">
          <div className="text-2xl font-bold font-mono text-green-700">{sensors.length}</div>
          <div className="text-xs text-green-600 mt-0.5">Total Ativo</div>
        </div>
      </div>
    </div>
  );
}

// src/pages/Dashboard.jsx
// Main dashboard: sensor map, stats, top cities

import { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSensors, useRanking, useCities } from '../hooks/useEnvironmentalData.js';
import { StatCard, ScoreRing, Spinner, ErrorAlert } from '../components/ui/index.jsx';
import RankingTable from '../components/ranking/RankingTable.jsx';
import { TopCitiesChart, ClassificationDonut } from '../components/charts/EnvironmentalChart.jsx';
import { classify, formatMeasurement } from '../utils/icaud.js';

const SensorMap = lazy(() => import('../components/map/SensorMap.jsx'));

function GlobalStats({ cities = [], sensors = [] }) {
  const validCities = cities.filter(c => c.icaud?.score !== null);
  const avgScore = validCities.length > 0
    ? validCities.reduce((s, c) => s + c.icaud.score, 0) / validCities.length
    : null;

  const avgTemp = sensors.filter(s => s.measurements.temperature !== null);
  const avgHum  = sensors.filter(s => s.measurements.humidity !== null);
  const avgPm25 = sensors.filter(s => s.measurements.pm25 !== null);
  const avgWind = sensors.filter(s => s.measurements.windSpeed !== null);

  const mean = (arr, field) =>
    arr.length > 0
      ? arr.reduce((s, x) => s + x.measurements[field], 0) / arr.length
      : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard label="Temperatura Média" value={mean(avgTemp, 'temperature')?.toFixed(1)} unit="°C" icon="🌡️" color="#f59e0b" />
      <StatCard label="Umidade Média"     value={mean(avgHum, 'humidity')?.toFixed(0)}     unit="%"   icon="💧" color="#3b82f6" />
      <StatCard label="PM2.5 Médio"       value={mean(avgPm25, 'pm25')?.toFixed(1)}         unit="µg/m³" icon="🌫️" color="#8b5cf6" />
      <StatCard label="Velocidade Vento"  value={mean(avgWind, 'windSpeed')?.toFixed(1)}   unit="m/s" icon="💨" color="#06b6d4" />
    </div>
  );
}

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState('live');

  const { data: sensors = [], isLoading: sensorsLoading, error: sensorsError } = useSensors({ limit: 500 });
  const { data: rankingRes,   isLoading: rankingLoading  } = useRanking(10);
  const { data: cities  = [], isLoading: citiesLoading  } = useCities();

  const ranking        = rankingRes?.data    || [];
  const rankingLoading2 = rankingLoading || rankingRes?.loading;
  const isLoading      = sensorsLoading || rankingLoading;

  // Calculate global average ICAU-D
  const validCities  = cities.filter(c => c.icaud?.score !== null);
  const globalAvgScore = validCities.length > 0
    ? validCities.reduce((s, c) => s + c.icaud.score, 0) / validCities.length
    : null;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Ambiental</h1>
          <p className="text-gray-500 text-sm mt-1">
            Índice de Conforto Urbano em tempo real de {sensors.length} sensores ativos em {cities.length} cidades
          </p>
        </div>
        <div className="flex-shrink-0">
          <ScoreRing score={globalAvgScore} size={100} />
          <p className="text-xs text-center text-gray-400 mt-1">ICAU-D Global</p>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTimePeriod('live')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            timePeriod === 'live'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          🔴 Ao Vivo
        </button>
        <button
          onClick={() => setTimePeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            timePeriod === 'week'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          📅 Últimos 7 Dias
        </button>
        <button
          onClick={() => setTimePeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            timePeriod === 'month'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          📊 Último Mês
        </button>
      </div>

      {sensorsError && <ErrorAlert message="Falha ao carregar dados dos sensores" />}

      {isLoading ? <Spinner /> : <GlobalStats cities={cities} sensors={sensors} />}

      {/* Mapa */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🗺️ Mapa de Sensores ao Vivo</h2>
        <Suspense fallback={<Spinner />}>
          {!sensorsLoading && (
            <SensorMap sensors={sensors} height="450px" />
          )}
        </Suspense>
      </div>

      {/* Gráficos + Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🏙️ Top Cidades por ICAU-D</h2>
          {citiesLoading ? <Spinner /> : <TopCitiesChart cities={ranking} />}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">📊 Distribuição por Classificação</h2>
          {citiesLoading ? <Spinner /> : <ClassificationDonut cities={cities} />}
        </div>
      </div>

      {/* Top 10 ranking */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">🏆 Top 10 Cidades</h2>
          <Link to="/ranking" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Ver ranking completo →
          </Link>
        </div>
        {(rankingLoading || rankingLoading2) ? (
          <Spinner />
        ) : ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
            <div className="animate-spin text-3xl">⚙️</div>
            <p className="text-sm">Carregando dados… atualizando automaticamente</p>
          </div>
        ) : (
          <RankingTable cities={ranking} />
        )}
      </div>
    </div>
  );
}

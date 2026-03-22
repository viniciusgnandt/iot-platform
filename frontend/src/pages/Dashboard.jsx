// src/pages/Dashboard.jsx
// Main dashboard: sensor map, stats, top cities

import { Suspense, lazy, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSensors, useSensorsHistory, useSensorsHistoryFallback, useRanking, useCities } from '../hooks/useEnvironmentalData.js';
import { formatRelativeTimeBRT, formatFullDateTimeBRT } from '../utils/dateFormatter.js';
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

  const avgTemp = sensors.filter(s => s.measurements?.temperature !== null && s.measurements?.temperature !== undefined);
  const avgHum  = sensors.filter(s => s.measurements?.humidity    !== null && s.measurements?.humidity    !== undefined);
  const avgPm25 = sensors.filter(s => s.measurements?.pm25        !== null && s.measurements?.pm25        !== undefined);
  const avgWind = sensors.filter(s => s.measurements?.windSpeed   !== null && s.measurements?.windSpeed   !== undefined);

  const mean = (arr, field) =>
    arr.length > 0
      ? arr.reduce((s, x) => s + x.measurements[field], 0) / arr.length
      : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard label="Temperatura Média" value={mean(avgTemp, 'temperature')?.toFixed(1)} unit="°C"    icon="🌡️" color="#f59e0b" />
      <StatCard label="Umidade Média"     value={mean(avgHum,  'humidity')?.toFixed(0)}    unit="%"     icon="💧" color="#3b82f6" />
      <StatCard label="PM2.5 Médio"       value={mean(avgPm25, 'pm25')?.toFixed(1)}        unit="µg/m³" icon="🌫️" color="#8b5cf6" />
      <StatCard label="Velocidade Vento"  value={mean(avgWind, 'windSpeed')?.toFixed(1)}   unit="m/s"   icon="💨" color="#06b6d4" />
    </div>
  );
}

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState('live');

  const { data: liveSensors = [], isLoading: sensorsLoading } = useSensors({ limit: 500 });
  const { data: historySensors = [], isLoading: historyLoading } = useSensorsHistory(timePeriod);
  const { data: fallbackSensors = [] } = useSensorsHistoryFallback();
  const { data: rankingRes, isLoading: rankingLoading } = useRanking(10);
  const { data: cities = [], isLoading: citiesLoading } = useCities();

  const isHistoryMode = timePeriod !== 'live';

  // Sensor selection with fallback:
  // - live mode: use live data, or fallback to MongoDB history if live is still empty
  // - history mode: use selected period history, or live data if history is empty
  const sensorsReady = isHistoryMode
    ? (historySensors.length > 0 ? historySensors : liveSensors)
    : (liveSensors.length > 0 ? liveSensors : fallbackSensors);

  const usingFallback = !isHistoryMode && liveSensors.length === 0 && fallbackSensors.length > 0;

  const ranking = rankingRes?.data || [];
  const rankingStillLoading = rankingLoading || rankingRes?.loading;
  const isLoading = sensorsLoading || rankingLoading || (isHistoryMode && historyLoading);

  const validCities = cities.filter(c => c.icaud?.score !== null);
  const globalAvgScore = validCities.length > 0
    ? validCities.reduce((s, c) => s + c.icaud.score, 0) / validCities.length
    : null;

  const mapReady = !(sensorsLoading || (isHistoryMode && historyLoading));

  // Data da leitura mais recente entre todos os sensores visíveis
  const lastReadingAt = useMemo(() => {
    const timestamps = sensorsReady
      .map(s => s.lastSeen)
      .filter(Boolean)
      .sort();
    return timestamps.at(-1) || null;
  }, [sensorsReady]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Ambiental</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isHistoryMode
              ? `Médias históricas (${timePeriod === 'week' ? '7 dias' : '30 dias'}) de ${sensorsReady.length} sensores em ${cities.length} cidades`
              : usingFallback
                ? `Exibindo dados históricos recentes (${sensorsReady.length} sensores) — dados ao vivo ainda carregando`
                : `Dados em tempo real de ${sensorsReady.length} sensores ativos em ${cities.length} cidades`
            }
          </p>
          {lastReadingAt && (
            <span
              title={`Última leitura: ${formatFullDateTimeBRT(lastReadingAt)} (BRT)`}
              className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500 cursor-help"
            >
              🕐 Atualizado {formatRelativeTimeBRT(lastReadingAt)}
            </span>
          )}
          {usingFallback && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              ⏳ Aguardando dados ao vivo — exibindo histórico recente
            </span>
          )}
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

      {isLoading ? <Spinner /> : <GlobalStats cities={cities} sensors={sensorsReady} />}

      {/* Mapa */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          🗺️ {isHistoryMode
            ? `Mapa — Média ${timePeriod === 'week' ? '7 dias' : '30 dias'}`
            : usingFallback ? 'Mapa — Dados Históricos Recentes' : 'Mapa de Sensores ao Vivo'
          }
        </h2>
        <Suspense fallback={<Spinner />}>
          {mapReady && sensorsReady.length > 0 ? (
            <SensorMap sensors={sensorsReady} height="450px" />
          ) : mapReady && sensorsReady.length === 0 ? (
            <div className="h-[450px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-sm">Aguardando dados dos sensores…</p>
              </div>
            </div>
          ) : (
            <div className="h-[450px] flex items-center justify-center"><Spinner /></div>
          )}
        </Suspense>
      </div>

      {/* Gráficos + Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🏙️ Top Cidades por ICAU-D</h2>
          {rankingStillLoading || ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 gap-2">
              <div className="animate-spin text-3xl">⚙️</div>
              <p className="text-sm">Carregando ranking…</p>
            </div>
          ) : (
            <TopCitiesChart cities={ranking} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">📊 Distribuição por Classificação</h2>
          {citiesLoading || cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 gap-2">
              <div className="animate-spin text-3xl">⚙️</div>
              <p className="text-sm">Carregando cidades…</p>
            </div>
          ) : (
            <ClassificationDonut cities={cities} />
          )}
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
        {rankingStillLoading ? (
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

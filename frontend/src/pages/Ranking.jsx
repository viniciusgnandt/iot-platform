// src/pages/Ranking.jsx
// Full city ranking page with filtering

import { useState } from 'react';
import { useRanking } from '../hooks/useEnvironmentalData.js';
import { Spinner, ErrorAlert } from '../components/ui/index.jsx';
import RankingTable from '../components/ranking/RankingTable.jsx';
import { CLASSIFICATIONS } from '../utils/icaud.js';

export default function Ranking() {
  const [limit, setLimit]        = useState(50);
  const [filterClass, setFilter]  = useState('');
  const { data: rankingRes, isLoading, refetch } = useRanking(limit);

  const cities         = rankingRes?.data    || [];
  const isLoadingData  = isLoading || rankingRes?.loading;

  const filtered = filterClass
    ? cities.filter(c => c.icaud?.classification?.label === filterClass)
    : cities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Ranking de Cidades</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cidades classificadas pelo Índice de Conforto Ambiental Urbano (ICAU-D)
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value={25}>Top 25</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>

        <select
          value={filterClass}
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as classificações</option>
          {CLASSIFICATIONS.map(c => (
            <option key={c.label} value={c.label}>{c.label}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500 flex items-center">
          Exibindo {filtered.length} cidades
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
            <div className="animate-spin text-4xl">⚙️</div>
            <p className="text-sm font-medium">Carregando dados ambientais…</p>
            <p className="text-xs text-gray-300">Atualizando automaticamente</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhuma cidade corresponde ao filtro atual</div>
        ) : (
          <RankingTable cities={filtered} showDetails={true} />
        )}
      </div>

      {/* Classification legend */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Guia de Classificação ICAU-D</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CLASSIFICATIONS.map(cls => (
            <div key={cls.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
              <div>
                <div className="text-sm font-medium text-gray-700">{cls.label}</div>
                <div className="text-xs text-gray-400">{cls.min}–{cls.max} pontos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// src/pages/ICAUDExplainer.jsx
// Comprehensive explanation of ICAU-D, platform architecture, and data flow

import { useState } from 'react';
import { ScoreRing, ClassificationBadge, StatCard } from '../components/ui/index.jsx';
import { classify, CLASSIFICATIONS, formatMeasurement } from '../utils/icaud.js';

/** Component explanation card */
function ComponentCard({ icon, name, ideal, formula, normalizedValue = null }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">Valor ideal: {ideal}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 mb-3 text-xs font-mono text-gray-700 overflow-x-auto">
        {formula}
      </div>

      {normalizedValue !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Score normalizado</span>
            <span className="font-semibold">{normalizedValue.toFixed(1)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, normalizedValue))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Classification row for the scale */
function ClassificationRow({ classification }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg">
      <div
        className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl"
        style={{ backgroundColor: `${classification.color}20` }}
      >
        <ScoreRing score={(classification.min + classification.max) / 2} size={60} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">{classification.label}</div>
        <div className="text-sm text-gray-600">
          Faixa: {classification.min} — {classification.max}
        </div>
      </div>
      <ClassificationBadge label={classification.label} color={classification.color} />
    </div>
  );
}

export default function ICAUDExplainer() {
  const [activeTab, setActiveTab] = useState('arquitetura');

  // Example calculation
  const exampleTemp = 25;
  const exampleHumidity = 60;
  const examplePM25 = 15;
  const exampleWind = 3;

  const tempNorm = Math.max(0, 100 - Math.abs(exampleTemp - 22) * 4);
  const humidityNorm = Math.max(0, 100 - Math.abs(exampleHumidity - 50) * 2);
  const airQualityNorm = Math.max(0, 100 - examplePM25 * 2);
  const windNorm = Math.max(0, 100 - Math.abs(exampleWind - 2) * 20);

  const weights = {
    temp: 0.4,
    humidity: 0.3,
    airQuality: 0.2,
    wind: 0.1,
  };
  const icaudScore = (
    tempNorm * weights.temp +
    humidityNorm * weights.humidity +
    airQualityNorm * weights.airQuality +
    windNorm * weights.wind
  );

  const exampleClassification = classify(icaudScore);

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Como Funciona a Plataforma
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            <strong>EcoSense</strong> é uma plataforma de monitoramento ambiental em tempo real.
            Ela coleta dados de sensores distribuídos globalmente, calcula o índice <strong>ICAU-D</strong>,
            e exibe em mapas, gráficos e rankings.
          </p>
          <p className="text-gray-600">
            Explore como o ICAU-D é calculado e como a plataforma funciona internamente.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
        <TabButton id="arquitetura" label="Arquitetura da Plataforma" icon="🏗️" />
        <TabButton id="icaud" label="ICAU-D - Índice de Conforto" icon="📊" />
        <TabButton id="fontes" label="Fontes de Dados" icon="🌍" />
      </div>

      {/* ============ TAB: ARQUITETURA ============ */}
      {activeTab === 'arquitetura' && (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-10 bg-blue-500 rounded"></div>
          <h2 className="text-3xl font-bold text-gray-900">Arquitetura da Plataforma</h2>
        </div>

        <div className="space-y-8">
          {/* Visão Geral */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Como Funciona</h3>
            <p className="text-gray-600 mb-4">
              EcoSense coleta dados de sensores públicos distribuídos globalmente, processa-os,
              calcula índices ambientais (ICAU-D) e apresenta em interface web interativa.
            </p>
            <p className="text-gray-600">
              O fluxo de dados acontece continuamente, com atualizações a cada 5-10 minutos,
              garantindo informações sempre atualizadas sem sobrecarregar APIs externas.
            </p>
          </div>

          {/* Fluxo de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Fluxo de Dados (6 Passos)</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-lg font-bold text-blue-600">1</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Coleta de Dados</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Backend busca dados de 3 redes públicas (OpenSenseMap, Sensor.Community, OpenWeather)
                    + sensores específicos do Brasil. Requisições feitas a cada 5 minutos via HTTP.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-lg font-bold text-green-600">2</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Normalização e Validação</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Dados de diferentes fontes convertidos para schema unificado. Sensores sem
                    <strong> todos os 4 componentes do ICAU-D</strong> são filtrados.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-lg font-bold text-purple-600">3</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Cálculo do ICAU-D</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Para cada sensor, calcula-se o índice ICAU-D com rebalanceamento dinâmico de pesos.
                    Dados salvos em MongoDB para histórico de até 30 dias.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-lg font-bold text-amber-600">4</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Agregação por Cidade</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Sensores agrupados por cidade via reverse geocoding (Nominatim). Calcula-se
                    média de medições e ICAU-D agregado. Cache de geocode em SQLite evita re-requisições.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center text-lg font-bold text-cyan-600">5</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Cache Distribuído</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Dados cachados em Redis (5-10 min de TTL). Fallback em memória com padrão
                    stale-while-revalidate. Reduz drasticamente carga nas APIs externas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-lg font-bold text-pink-600">6</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Apresentação no Frontend</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Frontend (React) exibe dados em mapas interativos, gráficos e rankings.
                    Interface atualiza em tempo real conforme novos dados chegam.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagrama de Arquitetura */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Diagrama Técnico</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 font-mono text-xs text-gray-700 overflow-x-auto">
              <pre>{`
┌──────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                            │
│    Dashboard | Mapa | Ranking | Sensores | Como Funciona    │
│              http://localhost:5173                            │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js / Express)                      │
│             http://localhost:3001/api                         │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐      │
│  │OpenSenseMap │  │Sensor.Community│  │OpenWeather     │      │
│  │  (global)   │  │  (global)      │  │ (fallback)     │      │
│  └────┬────────┘  └────┬──────────┘  └────┬───────────┘      │
│       │                │                   │                  │
│       └────────────────┼───────────────────┘                  │
│                        │                                      │
│           ┌────────────▼─────────────┐                       │
│           │ Normalize & Validate     │                       │
│           │ Filter (Need all 4 ICAU) │                       │
│           └────────────┬─────────────┘                       │
│                        │                                      │
│           ┌────────────▼─────────────┐                       │
│           │ Calculate ICAU-D         │                       │
│           │ Aggregate by City        │                       │
│           └────────────┬─────────────┘                       │
│                        │                                      │
│         ┌──────────────┼──────────────┐                      │
│         ▼              ▼              ▼                      │
│    ┌────────┐    ┌────────┐    ┌────────┐                  │
│    │MongoDB │    │ Redis  │    │SQLite  │                  │
│    │        │    │(Cache) │    │ (Geo)  │                  │
│    └────────┘    └────────┘    └────────┘                  │
│  (Histórico      (5-10 min   (Reverse  │
│   30 dias)       TTL)        Geocode)  │
└──────────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          </div>

          {/* Armazenamento de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Onde os Dados são Armazenados?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📦 MongoDB</h4>
                <p className="text-sm text-gray-600 mb-3"><strong>Banco principal (persistente)</strong></p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Histórico de leituras (até 30 dias)</li>
                  <li>Auto-expiração via TTL index</li>
                  <li>Queries por sensor/tempo/localização</li>
                  <li>Escalável e distribuído</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Redis</h4>
                <p className="text-sm text-gray-600 mb-3"><strong>Cache distribuído (rápido)</strong></p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Cache de sensores (5 min TTL)</li>
                  <li>Cache de cidades (10 min TTL)</li>
                  <li>Cache de ranking (10 min TTL)</li>
                  <li>Reduz requisições às APIs</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🗂️ SQLite</h4>
                <p className="text-sm text-gray-600 mb-3"><strong>Cache local (persistente)</strong></p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Geocode cache (lat/lon → cidade)</li>
                  <li>Persiste entre restarts</li>
                  <li>Limite: 5 GB</li>
                  <li>Evita chamadas ao Nominatim</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💾 Memória (In-process)</h4>
                <p className="text-sm text-gray-600 mb-3"><strong>Cache em tempo real (muito rápido)</strong></p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Dados mais recentes em RAM</li>
                  <li>Padrão: stale-while-revalidate</li>
                  <li>TTLs configuráveis</li>
                  <li>Fallback quando Redis/Mongo indisponíveis</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fontes de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Onde os Dados são Obtidos?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📦 OpenSenseMap</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Plataforma colaborativa com sensores educacionais (senseBoxes).
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global (maioria Europa)</div>
                  <div><strong>Atualização:</strong> ~15 min</div>
                  <div><strong>Dados:</strong> Temp, Umidade, PM, CO2</div>
                  <div><strong>URL:</strong> api.opensensemap.org</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🌍 Sensor.Community</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Rede de sensores de baixo custo focada em qualidade do ar (Luftdaten).
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global (maioria Europa)</div>
                  <div><strong>Atualização:</strong> ~1-5 min</div>
                  <div><strong>Dados:</strong> PM2.5, PM10, Temp, Umidade</div>
                  <div><strong>URL:</strong> data.sensor.community</div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⛅ OpenWeather</h4>
                <p className="text-sm text-gray-600 mb-3">
                  API meteorológica profissional (usado como fallback).
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global (cidades principais)</div>
                  <div><strong>Atualização:</strong> ~30 min</div>
                  <div><strong>Dados:</strong> Temp, Umidade, Vento, Pressão</div>
                  <div><strong>URL:</strong> api.openweathermap.org</div>
                </div>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🇧🇷 Brasil Sensors</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Busca especializada de sensores no Brasil com filtro geográfico.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Brasil (bbox)</div>
                  <div><strong>Atualização:</strong> ~5-15 min</div>
                  <div><strong>Dados:</strong> Todos componentes ICAU-D</div>
                  <div><strong>Fontes:</strong> OpenSenseMap + Sensor.Community</div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🗺️ Nominatim</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Serviço de geocoding reverso (lat/lon → cidade).
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global</div>
                  <div><strong>Rate limit:</strong> 1 req/s</div>
                  <div><strong>Cache:</strong> Local em SQLite</div>
                  <div><strong>URL:</strong> nominatim.openstreetmap.org</div>
                </div>
              </div>
            </div>
          </div>

          {/* Segurança e Privacidade */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🔒 Segurança e Privacidade</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Dados Públicos:</strong> Todos os dados provêm de APIs públicas.
                EcoSense não coleta informações pessoais de usuários.
              </p>
              <p>
                <strong>Anonimidade:</strong> Sensores são identificados apenas por ID/nome.
                Não há rastreamento de usuários da plataforma.
              </p>
              <p>
                <strong>Rate Limiting:</strong> Requisições limitadas a 100 por minuto por IP
                para proteger o backend de abuso.
              </p>
              <p>
                <strong>CORS:</strong> Requisições do frontend validadas com política de origem segura.
              </p>
              <p>
                <strong>Dados em Trânsito:</strong> Recomenda-se HTTPS em produção para proteger dados em trânsito.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ============ TAB: ICAU-D ============ */}
      {activeTab === 'icaud' && (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-10 bg-green-500 rounded"></div>
          <h2 className="text-3xl font-bold text-gray-900">ICAU-D — Índice de Conforto Ambiental Urbano Dinâmico</h2>
        </div>

        <div className="space-y-8">
          {/* O que é ICAU-D */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">O que é ICAU-D?</h3>
            <p className="text-gray-600 mb-4">
              <strong>ICAU-D</strong> significa <em>Índice de Conforto Ambiental Urbano Dinâmico</em>.
              É um índice que mede o conforto ambiental em áreas urbanas combinando múltiplas
              variáveis ambientais em um único valor entre 0 e 100.
            </p>
            <p className="text-gray-600">
              <strong>Quanto maior o índice, melhor o conforto.</strong> Um score de 80+ significa
              que o ambiente é muito confortável para atividades ao ar livre.
            </p>
          </div>

          {/* 4 Componentes */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Os 4 Componentes</h3>
            <p className="text-gray-600 mb-6">
              O ICAU-D normaliza cada medição ambiental para uma escala 0-100, onde 100 é o valor ideal:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard
                icon="🌡️"
                name="Temperatura"
                ideal="22°C"
                formula="Score = max(0, 100 - |T - 22| × 4)"
                normalizedValue={tempNorm}
              />
              <ComponentCard
                icon="💧"
                name="Umidade Relativa"
                ideal="50%"
                formula="Score = max(0, 100 - |U - 50| × 2)"
                normalizedValue={humidityNorm}
              />
              <ComponentCard
                icon="🌫️"
                name="Qualidade do Ar (PM2.5)"
                ideal="0 µg/m³"
                formula="Score = max(0, 100 - PM2.5 × 2)"
                normalizedValue={airQualityNorm}
              />
              <ComponentCard
                icon="💨"
                name="Velocidade do Vento"
                ideal="2 m/s"
                formula="Score = max(0, 100 - |V - 2| × 20)"
                normalizedValue={windNorm}
              />
            </div>
          </div>

          {/* Pesos */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Pesos dos Componentes</h3>
            <p className="text-gray-600 mb-6">
              O score final combina os 4 componentes com pesos diferentes. Se algum dado faltar,
              os pesos são automaticamente rebalanceados:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weights table */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Pesos Base</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span>🌡️</span> Temperatura
                    </span>
                    <span className="font-mono font-bold text-green-600">40%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span>💧</span> Umidade
                    </span>
                    <span className="font-mono font-bold text-blue-600">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span>🌫️</span> Qualidade do Ar
                    </span>
                    <span className="font-mono font-bold text-purple-600">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span>💨</span> Vento
                    </span>
                    <span className="font-mono font-bold text-cyan-600">10%</span>
                  </div>
                </div>
              </div>

              {/* Formula box */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Fórmula de Cálculo</h4>
                <div className="bg-white rounded p-3 text-xs font-mono text-gray-700 mb-3 overflow-x-auto">
                  ICAU-D = (T × 0.4) + (U × 0.3) + (AQ × 0.2) + (V × 0.1)
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Rebalanceamento:</strong> Se faltarem dados de PM2.5, por exemplo,
                  seus 20% são distribuídos proporcionalmente aos outros componentes.
                </p>
              </div>
            </div>
          </div>

          {/* Escala de Classificação */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Escala de Classificação</h3>
            <p className="text-gray-600 mb-6">
              O índice final entre 0 e 100 é classificado em 4 categorias:
            </p>

            <div className="space-y-3">
              {CLASSIFICATIONS.map((classification) => (
                <ClassificationRow key={classification.label} classification={classification} />
              ))}
            </div>
          </div>

          {/* Exemplo */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Exemplo de Cálculo</h3>
            <p className="text-gray-600 mb-6">
              Vamos calcular o ICAU-D para um local com os seguintes valores:
            </p>

            {/* Input values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                label="Temperatura"
                value={exampleTemp}
                unit="°C"
                icon="🌡️"
                color="#f59e0b"
              />
              <StatCard
                label="Umidade"
                value={exampleHumidity}
                unit="%"
                icon="💧"
                color="#3b82f6"
              />
              <StatCard
                label="PM2.5"
                value={examplePM25}
                unit="µg/m³"
                icon="🌫️"
                color="#8b5cf6"
              />
              <StatCard
                label="Vento"
                value={exampleWind}
                unit="m/s"
                icon="💨"
                color="#06b6d4"
              />
            </div>

            {/* Step by step */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h4 className="font-semibold text-gray-900 mb-3">Passo 1: Normalizar</h4>
                <div className="space-y-2 text-sm font-mono text-gray-700">
                  <div>🌡️ Temp = max(0, 100 - |{exampleTemp} - 22| × 4) = <span className="font-bold text-green-600">{tempNorm.toFixed(1)}</span></div>
                  <div>💧 Umid = max(0, 100 - |{exampleHumidity} - 50| × 2) = <span className="font-bold text-green-600">{humidityNorm.toFixed(1)}</span></div>
                  <div>🌫️ AQ = max(0, 100 - {examplePM25} × 2) = <span className="font-bold text-green-600">{airQualityNorm.toFixed(1)}</span></div>
                  <div>💨 Vento = max(0, 100 - |{exampleWind} - 2| × 20) = <span className="font-bold text-green-600">{windNorm.toFixed(1)}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h4 className="font-semibold text-gray-900 mb-3">Passo 2: Aplicar pesos</h4>
                <div className="text-sm font-mono text-gray-700">
                  = ({tempNorm.toFixed(1)} × 0.40) + ({humidityNorm.toFixed(1)} × 0.30) + ({airQualityNorm.toFixed(1)} × 0.20) + ({windNorm.toFixed(1)} × 0.10)
                  <div className="text-xs text-gray-500 mt-2">
                    = {(tempNorm * 0.4).toFixed(2)} + {(humidityNorm * 0.3).toFixed(2)} + {(airQualityNorm * 0.2).toFixed(2)} + {(windNorm * 0.1).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 p-5">
                <h4 className="font-semibold text-gray-900 mb-4">Resultado Final</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">ICAU-D Score</div>
                    <div className="text-3xl font-bold font-mono" style={{ color: exampleClassification?.color }}>
                      {icaudScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right">
                    <ClassificationBadge
                      label={exampleClassification?.label}
                      color={exampleClassification?.color}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ============ TAB: FONTES DE DADOS ============ */}
      {activeTab === 'fontes' && (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-10 bg-amber-500 rounded"></div>
          <h2 className="text-3xl font-bold text-gray-900">Fontes de Dados do Projeto</h2>
        </div>

        <div className="space-y-8">
          {/* Introdução */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-gray-600 mb-3">
              EcoSense integra dados de múltiplas fontes públicas para fornecer a cobertura mais abrangente possível
              de sensores ambientais e dados meteorológicos em todo o Brasil e globalmente.
            </p>
            <p className="text-gray-600 text-sm">
              Todas as fontes são públicas e livres para uso. Nenhuma informação pessoal é coletada ou armazenada.
            </p>
          </div>

          {/* Grid de Fontes */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Redes de Sensores</h3>

            {/* OpenSenseMap */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">📦 OpenSenseMap</h4>
                  <p className="text-sm text-gray-600 mt-1">Plataforma colaborativa com sensores educacionais</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Global</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global (maioria Europa)</div>
                <div><strong>Atualização:</strong> ~15 minutos</div>
                <div><strong>Dados:</strong> Temp, Umidade, PM2.5, CO2</div>
                <div><strong>Sensores:</strong> senseBoxes educacionais</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://opensensemap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 opensensemap.org →
                </a>
              </div>
            </div>

            {/* Sensor.Community */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">🌍 Sensor.Community</h4>
                  <p className="text-sm text-gray-600 mt-1">Rede de sensores de baixo custo (Luftdaten)</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Global</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global (maioria Europa)</div>
                <div><strong>Atualização:</strong> ~1-5 minutos</div>
                <div><strong>Dados:</strong> PM2.5, PM10, Temp, Umidade</div>
                <div><strong>Sensores:</strong> SDS011, DHT22, BME280</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://sensor.community" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 sensor.community →
                </a>
              </div>
            </div>
          </div>

          {/* APIs Meteorológicas */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">APIs Meteorológicas e de Qualidade do Ar</h3>

            {/* Open-Meteo */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">⛅ Open-Meteo</h4>
                  <p className="text-sm text-gray-600 mt-1">API meteorológica gratuita sem autenticação</p>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Grátis</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global (Brasil incluído)</div>
                <div><strong>Atualização:</strong> Horário</div>
                <div><strong>Dados:</strong> Temp, Umidade, Vento</div>
                <div><strong>Autenticação:</strong> Não requerida</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 open-meteo.com →
                </a>
              </div>
            </div>

            {/* AQICN */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">🔬 AQICN (World Air Quality)</h4>
                  <p className="text-sm text-gray-600 mt-1">Índice de qualidade do ar em tempo real</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">API Key</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> 100+ países (Brasil incluído)</div>
                <div><strong>Atualização:</strong> Tempo real</div>
                <div><strong>Dados:</strong> PM2.5, PM10, AQI</div>
                <div><strong>Autenticação:</strong> API Key (grátis)</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://aqicn.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 aqicn.org/api →
                </a>
              </div>
            </div>

            {/* BreezoMeter */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">💨 BreezoMeter</h4>
                  <p className="text-sm text-gray-600 mt-1">Dados de qualidade do ar de múltiplas fontes</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">API Key</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global (Brasil incluído)</div>
                <div><strong>Atualização:</strong> Tempo real</div>
                <div><strong>Dados:</strong> PM2.5, PM10, gases diversos</div>
                <div><strong>Autenticação:</strong> API Key (conta requerida)</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://breezometer.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 breezometer.com →
                </a>
              </div>
            </div>

            {/* OpenWeather */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">🌤️ OpenWeatherMap</h4>
                  <p className="text-sm text-gray-600 mt-1">API meteorológica profissional com dados de poluição</p>
                </div>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">API Key</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global (Brasil incluído)</div>
                <div><strong>Atualização:</strong> 4 horas forecast</div>
                <div><strong>Dados:</strong> Temp, Umidade, PM2.5, AQI</div>
                <div><strong>Autenticação:</strong> API Key (conta requerida)</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 openweathermap.org →
                </a>
              </div>
            </div>
          </div>

          {/* Serviços Complementares */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Serviços Complementares</h3>

            {/* Nominatim */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">🗺️ Nominatim (OSM)</h4>
                  <p className="text-sm text-gray-600 mt-1">Serviço de geocoding reverso (lat/lon → cidade)</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Gratuito</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Cobertura:</strong> Global</div>
                <div><strong>Rate Limit:</strong> 1 req/segundo</div>
                <div><strong>Cache:</strong> Local em SQLite</div>
                <div><strong>Autenticação:</strong> Não requerida</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a href="https://nominatim.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  📍 nominatim.org →
                </a>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumo das Fontes</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Sensores Comunitários:</span>
                <span>OpenSenseMap + Sensor.Community (sempre ativos)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Meteorologia:</span>
                <span>Open-Meteo (gratuito) + OpenWeatherMap (opcional)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Qualidade do Ar:</span>
                <span>AQICN (com key) + BreezoMeter (opcional)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Geocoding:</span>
                <span>Nominatim com cache local</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>Dica:</strong> Configure as API keys opcionais no arquivo <code className="bg-white px-2 py-1 rounded">.env</code> para expandir a cobertura de dados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500 border-t border-gray-100">
        <p className="font-semibold">EcoSense — Plataforma de Monitoramento Ambiental em Tempo Real</p>
        <p className="mt-2">Desenvolvido com dados públicos de comunidades globais de sensores.</p>
        <p className="mt-1">Uma iniciativa de ciência cidadã para democratizar o acesso a dados ambientais.</p>
      </div>
    </div>
  );
}


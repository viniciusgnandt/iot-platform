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
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Visão Geral</h3>
            <p className="text-gray-600 mb-3">
              EcoSense é uma aplicação <strong>full-stack containerizada</strong> composta por backend Node.js e
              frontend React, comunicando-se via REST API. Toda a persistência de dados é feita no
              <strong> MongoDB Atlas</strong> (nuvem).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { icon: '⚙️', label: 'Backend', value: 'Node.js + Express' },
                { icon: '🖥️', label: 'Frontend', value: 'React + Vite' },
                { icon: '📦', label: 'Banco de Dados', value: 'MongoDB Atlas' },
                { icon: '🐳', label: 'Deploy', value: 'Docker + Portainer' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-sm font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Fluxo de Dados — 7 Etapas</h3>
            <div className="space-y-3">
              {[
                {
                  num: 1, color: 'blue', icon: '🌐',
                  title: 'Coleta nas APIs Externas',
                  desc: 'Na startup e a cada 1 hora, o backend busca dados de 2 fontes públicas: Sensor.Community (qualidade do ar — ~200 sensores globais) e Open-Meteo (meteorologia — 48 cidades do Brasil e Europa). Retry automático com backoff em caso de falha de rede.',
                },
                {
                  num: 2, color: 'green', icon: '🔄',
                  title: 'Normalização para Schema Unificado',
                  desc: 'Dados heterogêneos das fontes são convertidos para um objeto sensor padrão: id, source, location {lat, lon, city, country}, measurements {temperature, humidity, pm25, pm10, windSpeed}, lastSeen. Sensores com dados de mais de 2 horas são descartados.',
                },
                {
                  num: 3, color: 'purple', icon: '📐',
                  title: 'Cálculo do Índice ICAU-D',
                  desc: 'Para cada sensor ativo, calcula-se o ICAU-D com pesos dinâmicos: temperatura (40%), umidade (30%), qualidade do ar/PM2.5 (20%), vento (10%). Se um componente não tem dado, o peso é redistribuído proporcionalmente entre os componentes disponíveis.',
                },
                {
                  num: 4, color: 'amber', icon: '💾',
                  title: 'Persistência no MongoDB Atlas',
                  desc: 'Todas as leituras são salvas na coleção SensorReading com TTL de 30 dias (índice automático de expiração). Isso forma o histórico que alimenta os filtros "7 dias" e "30 dias" do Painel e do Ranking.',
                },
                {
                  num: 5, color: 'orange', icon: '🗺️',
                  title: 'Reverse Geocoding via Nominatim',
                  desc: 'Coordenadas dos sensores da Sensor.Community são convertidas em nomes de cidades usando a API Nominatim (OpenStreetMap). Rate limit de 1 req/s é respeitado com fila serializada. Resultados são armazenados em MongoDB (coleção GeocodeEntry) — nunca re-consultados para a mesma coordenada.',
                },
                {
                  num: 6, color: 'cyan', icon: '🏙️',
                  title: 'Agregação e Cache por Cidade',
                  desc: 'Sensores com cidade resolvida são agrupados. Para cada cidade: média das medições, ICAU-D agregado, ranking por score. Resultados são cacheados em MongoDB (coleção CacheEntry, TTL 1 hora) para resposta instantânea ao frontend.',
                },
                {
                  num: 7, color: 'pink', icon: '🖥️',
                  title: 'Entrega ao Frontend via REST API',
                  desc: 'Frontend React consulta /api/sensors, /api/cities e /api/cities/ranking. Em produção, as requisições passam por Nginx (proxy reverso). React Query gerencia cache no cliente (55 min stale time). Se os dados ao vivo ainda não chegaram, o frontend usa automaticamente o histórico recente do MongoDB.',
                },
              ].map(step => (
                <div key={step.num} className="flex gap-4 items-start">
                  <div className={`flex-shrink-0 w-12 h-12 bg-${step.color}-100 rounded-lg flex items-center justify-center text-lg font-bold text-${step.color}-600`}>
                    {step.num}
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <span>{step.icon}</span>{step.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagrama de Arquitetura */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Diagrama Técnico</h3>
            <div className="bg-gray-950 border border-gray-700 rounded-xl p-6 font-mono text-xs text-green-400 overflow-x-auto">
              <pre className="leading-relaxed">{`
┌──────────────────────────────────────────────────────────────────────┐
│                    APIS EXTERNAS (Internet)                          │
│                                                                      │
│  ┌────────────────────────┐    ┌─────────────────────────────────┐   │
│  │   Sensor.Community     │    │         Open-Meteo              │   │
│  │  data.sensor.community │    │      api.open-meteo.com         │   │
│  │  ~200 sensores globais │    │  48 cidades (18 BR + 30 EU)     │   │
│  │  PM2.5, PM10, Temp,    │    │  Temperatura, Umidade, Vento    │   │
│  │  Umidade               │    │  Gratuito, sem chave de API     │   │
│  └──────────┬─────────────┘    └───────────────┬─────────────────┘   │
│             │                                  │                      │
│  ┌──────────┴──────────────────────────────────┘                      │
│  │    nominatim.openstreetmap.org (Reverse Geocoding)                 │
│  │    lat/lon → nome de cidade   |  1 req/s  |  cache MongoDB         │
│  └────────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────┘
                               │ HTTP fetch (a cada 1h + startup)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND  Node.js / Express  :3002                 │
│                                                                      │
│  startup / scheduler (1h)                                            │
│       │                                                              │
│       ▼                                                              │
│  fetchAllSensors()  ──►  normalização  ──►  cálculo ICAU-D           │
│       │                                        │                     │
│       │                            saveSensorReadingsBatch()         │
│       ▼                                        ▼                     │
│  reverseGeocode()  (fila 1 req/s)     MongoDB Atlas                  │
│       │                               ├── SensorReading (TTL 30d)    │
│       ▼                               ├── CacheEntry  (TTL 1h)       │
│  fetchAllCities()                     └── GeocodeEntry (permanente)  │
│  buildRanking()    ──►  cache.set()                                  │
│                                                                      │
│  REST API endpoints:                                                 │
│  GET /api/health            GET /api/cities                          │
│  GET /api/sensors           GET /api/cities/ranking                  │
│  GET /api/sensors/history   GET /api/cities/:name                    │
│  POST /api/refresh                                                   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTP/JSON (proxy via Nginx em produção)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 FRONTEND  React + Vite  (Nginx :80)                  │
│                                                                      │
│  React Query (cache 55min)  ──►  fallback automático p/ histórico    │
│                                                                      │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │
│  │  Painel  │ │ Ranking │ │   Mapa   │ │Sensores │ │Como Funciona│  │
│  │Dashboard │ │  + 7d   │ │Leaflet   │ │Explainer│ │  ICAU-D    │  │
│  │ charts   │ │  + 30d  │ │ + popup  │ │         │ │Arquitetura │  │
│  └──────────┘ └─────────┘ └──────────┘ └─────────┘ └────────────┘  │
│                                                                      │
│  Filtros: Ao Vivo | Últimos 7 Dias | Último Mês                      │
│  Filtros Ranking: Continente | País | Classificação ICAU-D           │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
             ┌─────────────────────────┐
             │   Docker + Portainer    │
             │  docker-compose.yml     │
             │  backend + frontend     │
             │  iot-platform.viniciusgnandt.com.br  │
             └─────────────────────────┘
`}</pre>
            </div>
          </div>

          {/* Stack Tecnológica */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Stack Tecnológica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">⚙️ Backend</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>Node.js + Express</strong> — servidor REST API</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>Mongoose</strong> — ODM para MongoDB</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>Axios</strong> — cliente HTTP com retry</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>Scheduler nativo</strong> — setInterval 1h (sem cron externo)</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>express-rate-limit</strong> — proteção contra abuso</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span><strong>Morgan + Winston</strong> — logging</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">🖥️ Frontend</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>React 18 + Vite</strong> — SPA com build otimizado</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>React Query</strong> — cache, retry e sincronização de dados</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>React Router</strong> — navegação SPA</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>Leaflet + React-Leaflet</strong> — mapas interativos</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>Recharts</strong> — gráficos e visualizações</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span><strong>Tailwind CSS</strong> — estilização utilitária</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">📦 Dados e Infraestrutura</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span><strong>MongoDB Atlas</strong> — cloud database (único storage)</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span><strong>TTL Index</strong> — auto-delete leituras com +30 dias</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span><strong>Docker + Compose</strong> — containers backend + frontend</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span><strong>Nginx</strong> — serve o React e proxeia /api para o backend</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span><strong>Portainer</strong> — deploy e gerenciamento dos containers</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">🔒 Segurança e Resiliência</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>Rate Limiting</strong> — 100 req/min por IP</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>CORS</strong> — origem validada (iot-platform.viniciusgnandt.com.br)</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>Trust Proxy</strong> — X-Forwarded-For correto atrás do Nginx</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>Retry com backoff</strong> — APIs externas com 3 tentativas</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>Fallback de cache</strong> — memória local se MongoDB indisponível</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span><strong>Dados públicos</strong> — nenhum dado pessoal de usuário coletado</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Armazenamento de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Estrutura do MongoDB Atlas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '📊', name: 'SensorReading', color: 'blue',
                  desc: 'Histórico de todas as leituras de sensores',
                  fields: ['sensorId, source, name', 'location {lat, lon, city, country}', 'measurements {temp, humidity, pm25, windSpeed}', 'icaud {score, classification}', 'recordedAt (TTL: 30 dias)'],
                },
                {
                  icon: '💾', name: 'CacheEntry', color: 'green',
                  desc: 'Cache de respostas para o frontend',
                  fields: ['key (sensors:all, cities:aggregated,', 'cities:ranking:50)', 'value (objeto JSON completo)', 'expiresAt (TTL: 1 hora)', 'Índice TTL auto-delete'],
                },
                {
                  icon: '🗺️', name: 'GeocodeEntry', color: 'purple',
                  desc: 'Cache permanente de reverse geocoding',
                  fields: ['key ("lat,lon" com 2 casas decimais)', 'city (nome da cidade resolvida)', 'Permanente — nunca expira', 'Evita re-consultar Nominatim', '~550+ entradas acumuladas'],
                },
              ].map(col => (
                <div key={col.name} className={`bg-${col.color}-50 border border-${col.color}-200 rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{col.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-900 font-mono text-sm">{col.name}</h4>
                      <p className="text-xs text-gray-600">{col.desc}</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mt-3">
                    {col.fields.map(f => (
                      <li key={f} className="text-xs text-gray-700 font-mono bg-white bg-opacity-60 rounded px-2 py-1">{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Fontes de Dados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Fontes de Dados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🌍 Sensor.Community</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Rede cidadã de sensores de baixo custo, focada em qualidade do ar (antigo Luftdaten).
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global (maioria na Europa)</div>
                  <div><strong>Atualização:</strong> 1–5 min por sensor</div>
                  <div><strong>Dados:</strong> PM2.5, PM10, Temp, Umidade</div>
                  <div><strong>API:</strong> data.sensor.community</div>
                  <div><strong>Custo:</strong> Gratuito, sem chave</div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⛅ Open-Meteo</h4>
                <p className="text-sm text-gray-600 mb-3">
                  API meteorológica open source. Cobre 48 cidades fixas no Brasil e Europa.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> 18 cidades BR + 30 EU</div>
                  <div><strong>Atualização:</strong> Horária</div>
                  <div><strong>Dados:</strong> Temperatura, Umidade, Vento</div>
                  <div><strong>API:</strong> api.open-meteo.com</div>
                  <div><strong>Custo:</strong> Gratuito, sem chave</div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🗺️ Nominatim (OpenStreetMap)</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Serviço público de geocoding reverso: converte lat/lon em nome de cidade.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Cobertura:</strong> Global</div>
                  <div><strong>Rate limit:</strong> 1 req/s (fila serializada)</div>
                  <div><strong>Cache:</strong> MongoDB permanente</div>
                  <div><strong>API:</strong> nominatim.openstreetmap.org</div>
                  <div><strong>Custo:</strong> Gratuito, sem chave</div>
                </div>
              </div>
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
              EcoSense integra dados de 2 fontes públicas gratuitas: <strong>Sensor.Community</strong> (qualidade do ar)
              e <strong>Open-Meteo</strong> (meteorologia), cobrindo cidades do Brasil e da Europa.
            </p>
            <p className="text-gray-600 text-sm">
              Todas as fontes são públicas e livres para uso. Nenhuma informação pessoal é coletada ou armazenada.
            </p>
          </div>

          {/* Grid de Fontes */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Redes de Sensores</h3>

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
                <div><strong>Cache:</strong> MongoDB Atlas</div>
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
                <span className="font-semibold w-32">Qualidade do Ar:</span>
                <span>Sensor.Community — PM2.5, PM10, Temp, Umidade (gratuito)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Meteorologia:</span>
                <span>Open-Meteo — Temp, Umidade, Vento (gratuito)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-32">Geocoding:</span>
                <span>Nominatim com cache no MongoDB Atlas</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>Dica:</strong> Todas as fontes são gratuitas e não requerem chave de API.
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


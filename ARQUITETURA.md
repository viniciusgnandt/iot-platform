# 🏗️ Arquitetura da Plataforma IoT Environmental

## 📋 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  - Dashboard com sensores (mapa inicializa em São Paulo)        │
│  - Ranking de cidades por ICAU-D                               │
│  - Detalhes de cidade                                           │
│  - Página educativa "Como Funciona"                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS/REST API
                          │ (Porta 80 exposta)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Routes                                               │  │
│  │ - GET /api/sensors → todos os sensores                 │  │
│  │ - GET /api/cities → cidades agregadas                  │  │
│  │ - GET /api/cities/ranking → top 50 cidades             │  │
│  │ - GET /api/cities/:name → detalhes de cidade           │  │
│  │ - GET /cache-stats → estatísticas de cache             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Services (Orquestração)                                  │  │
│  │ - sensorService: fetchAllSensors, fetchAllSensorsRaw   │  │
│  │ - cityService: fetchAllCities, buildRanking            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Cache (MongoDB Atlas)                                    │  │
│  │ - CacheEntry: Armazena sensores, cidades, ranking      │  │
│  │ - TTL: 5 min sensores, 10 min cidades/ranking         │  │
│  │ - Hit Rate: ~100% durante TTL                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas Cloud                           │
│                                                                  │
│  Collections:                                                   │
│  • sensorreadings: Histórico de leituras (TTL 30 dias)        │
│  • cacheentries: Cache persistente com TTL                    │
│                                                                  │
│  Indices:                                                       │
│  • sensorreadings: TTL index em recordedAt (30 dias)          │
│  • cacheentries: TTL index em expiresAt                       │
│                                                                  │
│  Features:                                                      │
│  • Backup automático diário                                    │
│  • Armazenamento: 512 MB (Free Tier M0)                       │
│  • Escalável em tempo real                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### 1️⃣ Inicialização (Warm-up)
```
App Start
  ↓
Conecta MongoDB
  ↓
Busca TODOS os sensores (228+ atualmente)
  ├─ OpenSenseMap
  ├─ Sensor.Community (PM2.5)
  ├─ OpenWeather
  └─ Open-Meteo Brasil
  ↓
Salva TODOS no MongoDB (sensorreadings)
  ↓
Filtra apenas sensores com localização válida
  ↓
Armazena em cache MongoDB (sensors:all)
  ↓
Agrega cidades (groupBy location)
  ↓
Calcula ICAU-D por cidade
  ↓
Armazena em cache (cities:aggregated)
  ↓
Constrói ranking top 50
  ↓
Armazena em cache (cities:ranking:50)
  ↓
✅ Plataforma pronta
```

### 2️⃣ Requisição de Sensores (Frontend)
```
GET /api/sensors
  ↓
Cache.getOrSet('sensors:all')
  ├─ HIT: Retorna dados em cache
  └─ MISS:
      ├─ Busca APIs externas
      ├─ Salva no MongoDB
      ├─ Armazena em cache (TTL 5min)
      └─ Retorna ao frontend
  ↓
Frontend renderiza 228 sensores no mapa
```

### 3️⃣ Requisição de Ranking
```
GET /api/cities/ranking
  ↓
Cache.getOrSet('cities:ranking:50')
  ├─ HIT: Retorna top 50
  └─ MISS:
      ├─ Busca cities:aggregated do cache
      ├─ Ordena por ICAU-D (score descending)
      ├─ Pega top 50
      ├─ Salva em cache (TTL 10min)
      └─ Retorna ao frontend
  ↓
Frontend exibe ranking em tabela
```

## 🔧 Componentes Principais

### Backend
- Express.js: Framework web
- Mongoose: ODM para MongoDB
- Axios: HTTP client para APIs externas
- dotenv: Gerenciamento de variáveis de ambiente

### Frontend
- React 18: UI framework
- Vite: Build tool (rápido)
- React Router: Navegação
- React Leaflet: Mapas interativos
- Tailwind CSS: Estilização

### Infrastructure
- Docker: Containerização
- MongoDB Atlas: Database cloud
- Nginx: Reverse proxy (frontend)

## 📊 Fluxo ICAU-D

```
Sensor Raw Data
  ├─ Temperatura (°C)
  ├─ Umidade (%)
  ├─ PM2.5 (µg/m³)
  └─ Velocidade do Vento (m/s)
  ↓
Normalizar componentes (0-100)
  ↓
Calcular score com pesos:
  • Qualidade do Ar (PM2.5): 40%
  • Temperatura: 30%
  • Umidade: 20%
  • Vento: 10%
  ↓
Score ICAU-D (0-100)
  ├─ 81-100: 🌿 Muito Confortável (Verde)
  ├─ 61-80: ✅ Confortável (Verde Claro)
  ├─ 31-60: 😐 Desconfortável (Laranja)
  └─ 0-30: ⚠️ Insalubre (Vermelho)
```

## 🚀 Deployment

### Local (Desenvolvimento)
```bash
npm install
npm run dev
```

### Docker (Produção)
```bash
docker compose build --no-cache
docker compose up -d
```

## ⚡ Performance

- Response Time: < 50ms (dados em cache)
- Cache Hit Rate: ~100% durante TTL
- Map Load: 228 sensores em < 2s
- Ranking Computation: < 500ms

# ⚡ Setup Rápido - IoT Platform

## Sem Docker (Desenvolvimento Local)

### 1. Backend

```bash
cd backend

# Instalar dependências (incluindo novas: mongoose, ioredis)
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env se necessário (padrões já estão configurados)
# MONGO_ENABLED=false  (comentar para desativar MongoDB)
# REDIS_ENABLED=false  (comentar para desativar Redis)

# Rodar em desenvolvimento
npm run dev
```

**Backend rodará em:** http://localhost:3001/api

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

**Frontend rodará em:** http://localhost:5173

---

## Com Docker (Produção/Staging)

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# Na raiz do projeto
docker compose up --build

# Em background
docker compose up -d --build
```

**Acesso:**
- Frontend: http://localhost
- Backend: http://localhost:3001/api
- MongoDB: localhost:27017
- Redis: localhost:6379

**Ver logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Parar:**
```bash
docker compose down
```

---

## Requisitos de Sistema

### Backend
- Node.js >=18.0.0
- npm ou yarn
- (Opcional) MongoDB >=4.0
- (Opcional) Redis >=6.0

### Frontend
- Node.js >=18.0.0
- npm ou yarn

### Docker
- Docker 20.10+
- Docker Compose 2.0+
- ~2GB RAM disponível

---

## Variáveis de Ambiente

### Backend (.env)

```env
# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Cache
CACHE_TTL_SENSORS=300
CACHE_TTL_CITIES=600
CACHE_TTL_RANKING=600

# Banco de Dados
MONGO_URI=mongodb://localhost:27017/iot_platform
MONGO_ENABLED=false  # Comentar para ativar

# Cache Distribuído
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false  # Comentar para ativar

# APIs Externas
OPENSENSEMAP_BASE_URL=https://api.opensensemap.org
SENSOR_COMMUNITY_BASE_URL=https://data.sensor.community/airrohr/v1/filter
OPENWEATHER_API_KEY=  # (opcional)
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Limites
MAX_SENSORS_PER_SOURCE=200
SENSOR_MAX_AGE_HOURS=2

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=EcoSense
```

---

## Solução de Problemas

### ❌ "Cannot find package 'mongoose'"

**Problema:** Dependências não foram instaladas.

**Solução:**
```bash
cd backend
npm install
```

### ❌ "Cannot find package 'ioredis'"

**Mesmo problema.** Execute `npm install` no backend.

### ❌ Frontend não conecta ao Backend

**Verificar:**
1. Backend está rodando em `http://localhost:3001`?
2. CORS_ORIGIN está correto no `.env` do backend?
3. Firewall está bloqueando porta 3001?

```bash
# Testar conexão backend
curl http://localhost:3001/api/sensors
```

### ❌ Docker não consegue conectar MongoDB

**Solução:**
```bash
docker compose down -v
docker compose up --build
```

### ❌ "Cidade desconhecida" aparecendo muito

**Motivo:** Limitações do Nominatim (1 req/segundo).

**Solução implementada:** Fallback automático com aproximação regional.

---

## Próximos Passos

- [ ] Rodar localmente e testar sensores
- [ ] Verificar dados do Brasil na aba "Sensores"
- [ ] Revisar página "Como Funciona" (ICAU-D)
- [ ] Revisar página "Sensores" (tipos e specs)
- [ ] Configurar MongoDB/Redis para produção
- [ ] Fazer deploy em cloud

---

## Estrutura de Diretórios

```
iot-platform/
├── backend/
│   ├── src/
│   │   ├── api/              # Adaptadores para APIs externas
│   │   ├── db/               # Schemas MongoDB
│   │   ├── middleware/        # Express middlewares
│   │   ├── models/            # Data models (sensor, ICAU-D)
│   │   ├── routes.js          # Definição de rotas
│   │   ├── services/          # Lógica de negócio
│   │   ├── utils/             # Utilities (cache, geo, logger)
│   │   ├── config/            # Configurações
│   │   └── index.js           # Entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Páginas (Dashboard, Mapa, etc)
│   │   ├── services/         # Chamadas à API
│   │   ├── utils/            # Utilities (ICAU-D formatting, etc)
│   │   ├── hooks/            # React hooks customizados
│   │   ├── App.jsx           # Roteamento principal
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
├── docker-compose.yml        # Orquestração Docker
├── .gitignore
└── README.md
```

---

## Dúvidas?

Consulte o arquivo correspondente:
- **ICAU-D:** Abra http://localhost:5173/about-icaud
- **Sensores:** Abra http://localhost:5173/about-sensors
- **Docker:** Veja `DOCKER_README.md`

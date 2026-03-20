# 🌿 EcoSense — IoT Environmental Data Platform

A full-stack platform that collects real-time environmental sensor data from public IoT networks, calculates the **Urban Environmental Comfort Index (ICAU-D)**, and displays interactive dashboards and city rankings.

---

## 📐 Architecture

```
iot-platform/
├── backend/          # Node.js + Express API
│   └── src/
│       ├── api/          # External API adapters (OpenSenseMap, Sensor.Community, OpenWeather)
│       ├── controllers/  # HTTP request handlers
│       ├── middleware/    # CORS, rate limiting, compression, logging
│       ├── models/       # Data models (Sensor, ICAU-D calculator)
│       ├── services/     # Business logic (sensor fetching, city aggregation)
│       ├── utils/        # Cache, logger, geo utilities
│       ├── config/       # Centralized configuration
│       └── routes.js     # Express router
└── frontend/         # React + Vite SPA
    └── src/
        ├── components/
        │   ├── charts/   # Chart.js visualizations
        │   ├── map/      # Leaflet sensor map
        │   ├── ranking/  # City ranking table
        │   └── ui/       # Shared UI components
        ├── hooks/        # React Query data hooks
        ├── pages/        # Dashboard, Ranking, Map, CityDetail
        ├── services/     # Axios API client
        └── utils/        # ICAU-D display utilities
```

---

## 🧮 ICAU-D Index Algorithm

The **Urban Environmental Comfort Index (ICAU-D)** normalizes environmental measurements to a 0–100 scale:

| Parameter   | Formula                            | Weight |
|-------------|-------------------------------------|--------|
| Temperature | `max(0, 100 - |T - 22| × 4)`       | 40%    |
| Humidity    | `max(0, 100 - |U - 50| × 2)`       | 30%    |
| Air Quality | `max(0, 100 - PM2.5 × 2)`          | 20%    |
| Wind Speed  | `max(0, 100 - |V - 2| × 20)`       | 10%    |

> **Weight rebalancing**: If a parameter is missing, its weight is redistributed proportionally among available parameters.

### Classification

| Score   | Label           | Color  |
|---------|-----------------|--------|
| 81–100  | Very Comfortable | 🟢 Green  |
| 61–80   | Comfortable      | 🟡 Lime   |
| 31–60   | Uncomfortable    | 🟠 Amber  |
| 0–30    | Unhealthy        | 🔴 Red    |

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. Clone & Install

```bash
git clone <repo-url>
cd iot-platform

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env — at minimum, PORT and CORS_ORIGIN are needed
# Optional: add OPENWEATHER_API_KEY for fallback data

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env if your backend runs on a different port
```

### 3. Start Backend

```bash
cd backend
npm run dev
# API available at http://localhost:3001/api
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
# Dashboard available at http://localhost:5173
```

---

## 📡 Data Sources

| Source | Description | Data |
|--------|-------------|------|
| [OpenSenseMap](https://api.opensensemap.org) | Community sensor network | PM2.5, PM10, Temperature, Humidity |
| [Sensor.Community](https://data.sensor.community) | Citizen science network (Luftdaten) | PM2.5, PM10, Temperature, Humidity |
| [OpenWeather](https://openweathermap.org) | Official weather API (optional fallback) | Temperature, Humidity, Wind Speed |

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api`.

### `GET /api/health`
Server health check.

### `GET /api/sensors`
Returns all active sensors with ICAU-D scores.

**Query params:**
- `source` — Filter by source (`opensensemap`, `sensor_community`, `openweather`)
- `minScore` — Minimum ICAU-D score
- `limit` — Max results (default: 500)

**Example response:**
```json
{
  "success": true,
  "count": 142,
  "data": [
    {
      "id": "osm_5f3a...",
      "source": "opensensemap",
      "name": "Berlin Mitte",
      "location": { "lat": 52.52, "lon": 13.405, "city": "Berlin", "country": "DE" },
      "measurements": {
        "temperature": 18.5,
        "humidity": 62,
        "pm25": 8.3,
        "pm10": 12.1,
        "windSpeed": null
      },
      "lastSeen": "2024-03-11T10:23:00Z",
      "icaud": {
        "score": 74.2,
        "classification": { "label": "Comfortable", "color": "#84cc16" },
        "components": { "temperature": 85.8, "humidity": 76, "airQuality": 83.4, "wind": null },
        "weights": { "temperature": 0.571, "humidity": 0.429, "airQuality": 0.286 },
        "availableComponents": ["temperature", "humidity", "airQuality"]
      }
    }
  ],
  "timestamp": "2024-03-11T10:25:00Z"
}
```

### `GET /api/cities`
All cities with aggregated sensor data.

**Query params:**
- `country` — Filter by country code
- `minSensors` — Minimum sensor count

### `GET /api/cities/ranking`
Cities ranked by ICAU-D (highest first).

**Query params:**
- `limit` — Max cities (default: 50, max: 200)

### `GET /api/cities/:city`
Detailed data for a specific city by name.

### `GET /api/icau?lat=...&lon=...`
Calculate ICAU-D for a coordinate using nearby sensors.

**Query params:**
- `lat` — Latitude (required)
- `lon` — Longitude (required)

---

## ⚙️ Configuration

### Backend `.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CACHE_TTL_SENSORS` | `300` | Sensor cache TTL (seconds) |
| `CACHE_TTL_CITIES` | `600` | City cache TTL (seconds) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per minute per IP |
| `MAX_SENSORS_PER_SOURCE` | `200` | Max sensors fetched per API |
| `SENSOR_MAX_AGE_HOURS` | `2` | Max sensor age before filtering |
| `OPENWEATHER_API_KEY` | — | Optional fallback API key |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

---

## 🏗️ Key Design Decisions

### Caching
All external API responses are cached in-memory using `node-cache`. Cache TTLs are configurable per data type. This prevents rate limiting and ensures fast response times.

### Weight Rebalancing
When sensor data is incomplete (e.g., no wind sensor), ICAU-D weights are proportionally redistributed. A sensor with only temperature + humidity will use weights of 57.1% and 42.9% respectively.

### City Aggregation
Sensors are grouped by city name (from sensor metadata or reverse geocoding via Nominatim/OSM). City-level ICAU-D is calculated from the average of all active sensors in that city.

### Error Resilience
Each external API adapter handles failures independently. If OpenSenseMap is down, data from Sensor.Community and OpenWeather still flows through. The platform degrades gracefully.

---

## 📊 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with map, stats, top 10 cities |
| Ranking | `/ranking` | Full sortable city ranking table |
| Map | `/map` | Full-page interactive sensor map |
| City Detail | `/cities/:name` | Individual city breakdown |

---

## 🔒 Security Features

- **Rate limiting**: 100 requests/minute per IP
- **CORS**: Configurable allowed origins
- **Input validation**: Coordinates and query params validated
- **No secrets in frontend**: API keys stay server-side

---

## 📝 License

MIT

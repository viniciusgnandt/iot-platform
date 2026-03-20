# 🌿 Arquitetura Simplificada - EcoSense IoT

## ✅ O Que Foi Removido

```
❌ MongoDB (persistência de histórico)
❌ Redis (cache distribuído)
```

## ✨ Nova Arquitetura

```
┌──────────────────────────────────────────┐
│         EXTERNA (Internet)               │
│           Porta 80 Exposta               │
└──────────────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  FRONTEND (Nginx)    │
        │  iot_frontend:80     │
        │                      │
        │  SPA + API Proxy     │
        └──────────────┬───────┘
                       │
            (rede interna)
                       │
        ┌──────────────▼───────┐
        │  BACKEND (Node.js)   │
        │  iot_backend:3001    │
        │                      │
        │ Cache em Memória:    │
        │ • Stale-while-revalidate
        │ • TTL 5-10 min       │
        │ • SQLite (geocode)   │
        └──────────────────────┘
```

---

## 🎯 Como Funciona Agora

### **Fluxo de Dados**

```
1. Frontend requisita /api/sensors
   ↓
2. Nginx roteia para Backend:3001
   ↓
3. Backend verifica Cache em Memória
   ↓
   ✅ Achou? Retorna imediatamente
   ❌ Expirou? Busca APIs externas
   ↓
4. Dados buscados de:
   • OpenSenseMap
   • Sensor.Community
   • OpenWeather
   • BreezoMeter (se API key)
   • AQICN (se API key)
   • Open-Meteo
   ↓
5. Calcula ICAU-D
   ↓
6. Salva em Cache Memória (TTL 5-10 min)
   ↓
7. SQLite guarda geocodes (local, persistente)
   ↓
8. Retorna JSON para Frontend
```

---

## 💾 Camadas de Cache (Simplificadas)

| Camada | Tipo | Velocidade | TTL | Persistência |
|--------|------|-----------|-----|--------------|
| **Memória** | In-process | Microsegundos | 5-10 min | Sessão |
| **SQLite** | Local DB | Milissegundos | ∞ | Restarts |

---

## ✅ Vantagens da Arquitetura Simplificada

- ✅ **Sem dependências externas** (apenas Node + Nginx)
- ✅ **Rápido de iniciar** (3-5 segundos)
- ✅ **Menos recursos** (menos memória)
- ✅ **Cache automático** (stale-while-revalidate)
- ✅ **Persistência local** (SQLite para geocodes)

---

## ⚠️ Limitações

| Limitação | Detalhe |
|-----------|---------|
| **Sem histórico** | Dados de 30 dias não são salvos |
| **Memória compartilhada** | Apenas com Container atual |
| **Restart limpa cache** | Dados em memória são perdidos |
| **Escalabilidade** | Múltiplas replicas não compartilham cache |

---

## 📊 Dados Que Persistem

```
✅ PERSISTEM (SQLite):
   └─ Geocodes (lat/lon → cidade)
   └─ Carregado uma vez, usa sempre

❌ NÃO PERSISTEM:
   └─ Leituras de sensores
   └─ ICAU-D scores
   └─ Top 10 cidades
   └─ Outros caches
```

---

## 🚀 Deploy Simplificado

```bash
cd iot-platform

# Build e start
docker-compose up --build

# Acesso
http://seu-ip
```

Apenas 2 containers:
- iot_backend
- iot_frontend

---

## 🔄 Warm-up na Inicialização

Quando o backend inicia:

```
🔄 Iniciando warm-up do cache...

1. Buscando sensores de 6 fontes...
   - OpenSenseMap
   - Sensor.Community
   - OpenWeather
   - BreezoMeter
   - AQICN
   - Open-Meteo

2. Filtrando (ICAU-D completo)

3. Calculando scores

4. Carregando em memória

✅ Warm-up complete! Plataforma pronta
```

⏱️ Tempo: 30-60 segundos (primeira vez)

---

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| **Tempo 1ª requisição** | 30-60s (warm-up) |
| **Tempo requisições posteriores** | <100ms (memória) |
| **Tamanho imagens Docker** | ~500MB total |
| **RAM utilizada** | ~200MB (backend + frontend) |
| **Dados em Cache** | ~50-100 sensores |

---

## 🔧 Se Precisar Adicionar Dados Históricos Depois

Basta adicionar MongoDB de volta:

```yaml
# docker-compose.yml
mongo:
  image: mongo:7
  volumes:
    - mongo_data:/data/db

# backend environment
MONGO_URI: mongodb://mongo:27017/iot_platform
MONGO_ENABLED: "true"
```

Sistema é **100% compatível** com adição de MongoDB depois!

---

## ✨ Resumo

- 🎯 **Simples**: Backend + Frontend + Cache em memória
- ⚡ **Rápido**: Cache stale-while-revalidate
- 🔒 **Seguro**: Apenas porta 80 exposta
- 🌍 **Escalável**: Pronto para adicionar MongoDB depois
- 🌿 **Eficiente**: Sem desperdício de recursos

**Pronto para ir ao ar!** 🚀

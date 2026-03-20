# 🌐 Arquitetura de Rede - EcoSense IoT Platform

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNA (Internet/LAN)                     │
│                        PORT 80                              │
│                      (Exposta)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  FRONTEND (Nginx)        │
        │  iot_frontend:80         │
        │                          │
        │ SPA + API Proxy          │
        └──────────────┬───────────┘
                       │
                       │ rede interna (iot_network)
                       │
        ┌──────────────▼───────────┐
        │  BACKEND (Node.js API)   │
        │  iot_backend:3001        │
        │  (Interno - sem porta)   │
        └──────┬──────────┬────────┘
               │          │
      ┌────────▼─┐   ┌───▼────────┐
      │  MONGO   │   │  REDIS     │
      │  :27017  │   │  :6379     │
      │(Interno) │   │(Interno)   │
      └──────────┘   └────────────┘
```

---

## 📡 Comunicação Entre Containers

### **Rede Interna (iot_network)**

Todos os containers estão conectados à rede bridge `iot_network`:

```
Container → Hostname (DNS automático)
─────────────────────────────────────
frontend  → http://backend:3001/api
backend   → mongodb://mongo:27017
backend   → redis://redis:6379
```

### **Exemplo de Fluxo de Requisição**

```
1. USUÁRIO acessa http://seu-servidor/
   │
   ├─ Nginx (porta 80 exposta) recebe
   │
   ├─ Nginx roteia /api/* → http://backend:3001/api/*
   │  (pela rede interna - sem sair para internet)
   │
   ├─ Backend recebe em localhost:3001
   │
   ├─ Backend consulta Redis: redis://redis:6379
   │  (dentro da rede interna)
   │
   ├─ Se miss, Backend consulta MongoDB: mongodb://mongo:27017
   │  (dentro da rede interna)
   │
   └─ Resposta JSON volta para Frontend
      (Nginx envia de volta para o navegador)
```

---

## 🔒 Segurança de Rede

### **Portas Expostas**
- ✅ **80** (HTTP Frontend) - ÚNICA exposta

### **Portas Internas (Não Acessíveis de Fora)**
- ❌ 27017 (MongoDB)
- ❌ 6379 (Redis)
- ❌ 3001 (Backend API)

Isso significa:
- ✅ Usuário pode acessar dashboard
- ✅ Dashboard pode chamar API via Nginx
- ❌ Ninguém pode acessar MongoDB diretamente
- ❌ Ninguém pode acessar Redis diretamente
- ❌ Ninguém pode acessar Backend diretamente

---

## 🔧 Configurações Relevantes

### **nginx.conf (Frontend)**
```nginx
location /api/ {
    proxy_pass http://backend:3001/api/;
    # ↑ Usa o hostname interno
}
```

### **docker-compose.yml (Backend)**
```yaml
environment:
  MONGO_URI: mongodb://mongo:27017/iot_platform
  REDIS_URL: redis://redis:6379
  # ↑ Usa nomes de containers como hostnames
```

---

## 📊 Verificação no Portainer

### **Ver Rede**
1. Vá em **Networks** → `iot_network`
2. Deve mostrar 4 containers conectados:
   - iot_frontend
   - iot_backend
   - iot_mongo
   - iot_redis

### **Testar Conectividade**

**De dentro do frontend (Nginx) para backend:**
```bash
docker exec iot_frontend wget -O- http://backend:3001/api/sensors
# Deve retornar JSON de sensores
```

**De dentro do backend para MongoDB:**
```bash
docker exec iot_backend mongosh mongodb://mongo:27017/iot_platform --eval "db.sensorReadings.countDocuments()"
# Deve retornar número de documentos
```

**De dentro do backend para Redis:**
```bash
docker exec iot_backend redis-cli -h redis ping
# Deve responder: PONG
```

---

## 🚀 Benefícios desta Configuração

| Benefício | Descrição |
|-----------|-----------|
| **Segurança** | Apenas Nginx exposta, BD/Cache isolados |
| **Performance** | Comunicação 0ms (rede local Docker) |
| **Simplificidade** | DNS automático entre containers |
| **Escalabilidade** | Fácil adicionar mais replicas |
| **Isolamento** | Containers não acessam internet internamente |

---

## ⚠️ Troubleshooting

### **Backend não consegue conectar ao Redis**
```
Verificar em docker-compose.yml:
REDIS_URL: redis://redis:6379
            ↑ Deve ser o nome do container (redis)
```

### **Frontend retorna 502 (Bad Gateway)**
```
Verificar nginx.conf:
proxy_pass http://backend:3001/
            ↑ Deve ser o nome do container (backend)
```

### **MongoDB não conecta**
```
Verificar MONGO_URI:
mongodb://mongo:27017/iot_platform
          ↑ Deve ser o nome do container (mongo)
```

---

## 📋 Resumo

- ✅ **Apenas porta 80 exposta** ao mundo externo
- ✅ **Todos os containers se falam** via rede interna (iot_network)
- ✅ **Nomes de containers = hostnames DNS** (automático)
- ✅ **Seguro, rápido e escalável**

Pronto para produção! 🌿

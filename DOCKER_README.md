# 🐳 Infraestrutura Docker - EcoSense IoT Platform

Este guia descreve como subir toda a plataforma usando Docker Compose.

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- ~2GB de memória disponível

## Estrutura de Serviços

```
┌─────────────────────────────────────────────┐
│         Frontend (Nginx)                     │
│         Port: 80                             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Backend (Node.js API)                │
│         Port: 3001                           │
└────────┬─────────────────────────┬───────────┘
         │                         │
    ┌────▼─────┐            ┌─────▼───────┐
    │  MongoDB  │            │    Redis    │
    │ Port:27017│            │ Port: 6379  │
    └───────────┘            └─────────────┘
```

## Iniciar a Plataforma

### 1. Clonar/Preparar o Repositório

```bash
cd iot-platform
```

### 2. Subir os Serviços

```bash
# Build das imagens e iniciar os containers
docker compose up --build

# Em background (detached mode)
docker compose up -d --build
```

### 3. Aguardar Inicialização

Os serviços podem levar alguns minutos para subir completamente (especialmente na primeira vez).

```bash
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f mongo
docker compose logs -f redis
```

## Acessar a Plataforma

Após o startup:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Gerenciar Dados

### MongoDB

```bash
# Acessar shell do Mongo
docker exec -it iot_mongo mongosh iot_platform

# Ver coleções
db.getCollectionNames()

# Ver sensores salvos
db.sensorreadings.countDocuments()

# Ver últimas leituras
db.sensorreadings.find().limit(5).pretty()
```

### Redis

```bash
# Acessar CLI do Redis
docker exec -it iot_redis redis-cli

# Ver todas as chaves
keys *

# Ver info do cache
info stats

# Limpar cache
flushdb
```

## Parar a Plataforma

```bash
# Parar mas manter dados (volumes)
docker compose stop

# Parar e remover containers (dados persistem nos volumes)
docker compose down

# Parar e remover tudo incluindo volumes
docker compose down -v
```

## Troubleshooting

### Backend não conecta ao Mongo

```bash
# Ver se o Mongo está saudável
docker compose ps mongo

# Ver logs do Mongo
docker compose logs mongo

# Reiniciar Mongo
docker compose restart mongo
```

### Redis cache não funcionando

```bash
# Ver se Redis está rodando
docker compose ps redis

# Testar conexão
docker exec -it iot_redis redis-cli ping
# Resposta esperada: PONG
```

### Remover dados e começar do zero

```bash
# Parar e remover tudo
docker compose down -v

# Subir novamente (vai criar volumes vazios)
docker compose up --build
```

### Limpeza de recursos

```bash
# Remover imagens não usadas
docker image prune

# Remover volumes não usados
docker volume prune

# Limpeza completa (cuidado!)
docker system prune -a --volumes
```

## Desenvolvimento Local

Se preferir não usar Docker, pode rodar localmente:

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com MONGO_URI e REDIS_URL locais
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variáveis de Ambiente

As variáveis estão definidas no `docker-compose.yml`. Para customizar, edite o arquivo.

### Backend

```yaml
MONGO_URI: mongodb://mongo:27017/iot_platform
REDIS_URL: redis://redis:6379
NODE_ENV: production
PORT: 3001
```

### Frontend

```yaml
VITE_API_BASE_URL: http://localhost:3001/api
```

## Performance e Limites

| Serviço | Limite | Nota |
|---------|--------|------|
| MongoDB | Sem limite | Volume pode crescer com histórico de sensores |
| Redis   | 512MB | Auto-evicta chaves LRU quando limite atingido |
| Backend | - | Node.js single-thread |
| Frontend | - | Servido via Nginx com compressão gzip |

## Backup

### MongoDB

```bash
# Fazer backup do banco
docker exec iot_mongo mongodump --out /tmp/backup

# Copiar backup para host
docker cp iot_mongo:/tmp/backup ./mongo_backup
```

### Redis

```bash
# Dados são salvos em redis_data volume
docker cp iot_redis:/data ./redis_backup
```

## Próximos Passos

- [ ] Configurar HTTPS (usar nginx-proxy ou Let's Encrypt)
- [ ] Adicionar monitoring (Prometheus + Grafana)
- [ ] Configurar alertas para sensores problemáticos
- [ ] Implementar CI/CD com GitHub Actions
- [ ] Escalar para múltiplas instâncias (Docker Swarm ou Kubernetes)

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `docker compose logs`
2. Verifique a saúde dos serviços: `docker compose ps`
3. Tente remover e reconstruir: `docker compose down -v && docker compose up --build`

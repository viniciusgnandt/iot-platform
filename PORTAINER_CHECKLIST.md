# ✅ Checklist Portainer - EcoSense IoT Platform

## 📋 Deploy no Portainer

### **Passo 1: Criar Nova Stack**
- [ ] Acesse Portainer → Stacks → Add Stack
- [ ] **Nome:** `iot-platform`
- [ ] **Compose editor:** Cole o conteúdo de `docker-compose.yml`

### **Passo 2: Variáveis de Ambiente**
Portainer pode carregar do arquivo `.env`:
- [ ] Se o campo aparecer, aponte para `backend/.env`
- [ ] Ou copie manualmente (já estão configuradas)

---

## 🔍 Verificação Pós-Deploy

### **1. Aguardar Saúde dos Containers**
No Portainer → Stacks → `iot-platform`:

```
Container          Status    Health
─────────────────────────────────────
iot_mongo          Running   ✅ Healthy
iot_redis          Running   ✅ Healthy
iot_backend        Running   ✅ Healthy
iot_frontend       Running   ✅ Healthy
```

⏱️ Espere **2-3 minutos** para todos ficarem `healthy`

---

### **2. Verificar Portas Expostas**
- [ ] Apenas **porta 80** deve estar exposta externamente
- [ ] Mongo (27017) - NÃO exposto ✅
- [ ] Redis (6379) - NÃO exposto ✅
- [ ] Backend (3001) - NÃO exposto ✅

---

### **3. Testar Frontend**
```
Abra no navegador: http://SEU_IP/
```
- [ ] Painel carrega sem erros
- [ ] Vê "Painel Ambiental"
- [ ] Filtros de tempo aparecem (Ao Vivo, 7 dias, Mês)
- [ ] Mapa de sensores carrega
- [ ] Tabela de top 10 cidades aparece

---

### **4. Testar API via Frontend**
No navegador, abra developer tools (F12):
- [ ] Aba **Network** mostra requisições para `/api/sensors`
- [ ] Status code: **200 OK**
- [ ] Response type: **application/json**
- [ ] Dados de sensores aparecem

---

### **5. Verificar MongoDB (dados salvos)**

No Portainer:
1. Containers → `iot_mongo`
2. Clique em **Exec Console** (ou >_ terminal)
3. Execute:

```bash
mongosh iot_platform
```

```javascript
// Dentro do mongosh:
db.sensorReadings.countDocuments()
// Deve responder: número > 0
```

Se houver documentos, significa:
- ✅ Backend salvou dados no MongoDB
- ✅ Histórico de 30 dias funcionando

---

### **6. Verificar Redis (cache funcionando)**

No Portainer:
1. Containers → `iot_redis`
2. Clique em **Exec Console**
3. Execute:

```bash
redis-cli
ping
```

Deve responder: `PONG`

Para ver chaves cacheadas:
```bash
KEYS *
```
Deve mostrar chaves como: `sensors:all`, `cities:aggregated`, etc.

---

### **7. Verificar Rede Interna**

No Portainer:
1. Networks → `iot_network`
2. Deve listar 4 containers:
   - [ ] iot_frontend
   - [ ] iot_backend
   - [ ] iot_mongo
   - [ ] iot_redis

---

## 🧪 Testes Detalhados

### **Teste 1: Frontend → Backend**
1. Abra Browser DevTools (F12)
2. Aba **Network**
3. Atualize a página
4. Procure por requisição `api/sensors`
5. Deve retornar JSON com array de sensores

✅ Se funcionar: Frontend consegue chamar Backend via Nginx

---

### **Teste 2: Backend → MongoDB**
No Portainer:
```bash
docker exec iot_backend mongosh mongodb://mongo:27017/iot_platform --eval "db.sensorReadings.findOne()"
```

Deve retornar um documento JSON com campo `recordedAt`

✅ Se funcionar: Backend está salvando no MongoDB

---

### **Teste 3: Backend → Redis**
No Portainer:
```bash
docker exec iot_backend redis-cli -h redis info server
```

Deve mostrar informações do Redis (versão, uptime, etc)

✅ Se funcionar: Backend consegue usar cache Redis

---

### **Teste 4: Persistência de Dados**
1. Pare o container backend: `docker-compose stop backend`
2. Aguarde 10s
3. Volte online: `docker-compose start backend`
4. Acesse http://seu-ip novamente
5. Dados ainda aparecem (saíram do MongoDB)

✅ Se funcionar: Dados persistem entre restarts

---

## 📊 Logs para Diagnosticar Problemas

### **Ver todos os logs**
Portainer → Stack `iot-platform` → **Logs**

### **Filtrar por container**
Containers → Nome do container → **Logs**

---

## 🚨 Problemas Comuns

### **Problema: Frontend mostra "connecting..." infinito**
```
Causa: Backend não iniciou ou não está healthy
Solução:
1. Verificar logs do backend
2. Aguardar ✅ healthy no iot_backend
3. Verificar MONGO_URI e REDIS_URL no environment
```

### **Problema: Dados vazios no dashboard**
```
Causa: Warm-up ainda rodando ou erro ao buscar APIs
Solução:
1. Aguardar 2-3 min após subir
2. Verificar logs: "✅ Warm-up complete"
3. Tentar atualizar página (Ctrl+F5)
```

### **Problema: Nginx retorna 502 Bad Gateway**
```
Causa: Backend não acessível
Solução:
1. Verificar se iot_backend está ✅ healthy
2. Verificar proxy_pass em nginx.conf: http://backend:3001
3. Verificar rede interna (iot_network)
```

### **Problema: MongoDB não salva dados**
```
Causa: MONGO_URI incorreta ou mongo não está pronto
Solução:
1. Verificar MONGO_URI: mongodb://mongo:27017/iot_platform
2. Verificar se iot_mongo está ✅ healthy
3. Verificar logs do backend para erros Mongoose
```

---

## 📈 Monitoramento Contínuo

### **Verificar Status Diário**
1. Portainer → Stacks → `iot-platform`
2. Todos os containers devem estar ✅ Healthy e Running
3. Se algum não estiver healthy, clicar nele e ver Logs

### **Limpar Dados Antigos (MongoDB)**
MongoDB autolimpa dados com mais de 30 dias (TTL index configurado)

### **Resetar Cache Redis**
Se necessário, no Portainer exec do redis:
```bash
FLUSHALL
```

---

## ✅ Checklist Final

- [ ] Docker-compose.yml copiado no Portainer
- [ ] Todos 4 containers em status **Running** e **Healthy**
- [ ] Apenas porta 80 exposta externamente
- [ ] Frontend abre em http://seu-ip
- [ ] API retorna dados em http://seu-ip/api/sensors
- [ ] MongoDB tem documentos salvos
- [ ] Redis responde ao ping
- [ ] Rede interna (iot_network) conecta todos 4 containers
- [ ] Testes de banco de dados passaram
- [ ] Logs não mostram erros críticos

---

## 🎉 Pronto para Produção!

Quando todo o checklist estiver ✅, seu sistema está:
- 🔒 Seguro (apenas porta 80 exposta)
- ⚡ Performático (cache com Redis)
- 💾 Persistente (dados no MongoDB)
- 🌍 Escalável (arquitetura de microsserviços)

**Desfute da plataforma EcoSense!** 🌿

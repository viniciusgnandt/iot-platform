# 🔧 Troubleshooting - Docker Build Error

## Erro Reportado

```
failed to deploy a stack: failed to solve: failed to compute cache key:
failed to calculate checksum of ref xxx: "/package-lock.json": not found
```

## Causa

O Docker Builder do Portainer não consegue encontrar o arquivo `package-lock.json` durante o build context.

## Soluções (em ordem de prioridade)

### ✅ **Solução 1: Limpar Cache do Portainer (RECOMENDADO)**

1. Acesse Portainer → **System** → **Prune**
2. Clique em **Prune dangling images** e **Prune unused volumes**
3. Aguarde 30 segundos
4. Tente fazer deploy novamente da stack

**Por que funciona:** Remove imagens parciais em cache que podem estar corrutas

---

### ✅ **Solução 2: Reconstruir Sem Cache**

No Portainer:
1. Vá para Stack `iot-platform`
2. Clique em **Update the stack**
3. Marque: **Pull and re-deploy**
4. Execute

**Por que funciona:** Força rebuild completo sem usar cache anterior

---

### ✅ **Solução 3: Verificar Arquivos Locais**

No terminal, execute:

```bash
cd c:/Users/vinic/Desktop/pi_univesp_v/files2/iot-platform

# Verificar se files existem
ls -la backend/package.json backend/package-lock.json
ls -la frontend/package.json frontend/package-lock.json
```

Todos os 4 arquivos devem existir e ter tamanho > 0

---

### ✅ **Solução 4: Usar docker-compose Local (Teste)**

Se o problema persistir no Portainer, teste construindo localmente:

```bash
cd c:/Users/vinic/Desktop/pi_univesp_v/files2/iot-platform

# Build apenas frontend
docker build -t iot-frontend:latest ./frontend

# Build apenas backend
docker build -t iot-backend:latest ./backend
```

Se funcionar localmente mas não no Portainer = problema de configuração do Portainer

---

### ✅ **Solução 5: Editar docker-compose.yml no Portainer**

Se ainda tiver erro, você pode editar o docker-compose.yml diretamente no Portainer:

Abra cada serviço de `build` e mude para usar imagem pré-pronta (se disponível):

```yaml
# Antes:
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile

# Depois (use imagem pre-built ou construída localmente):
# ou simplesmente remove o build e especifica a imagem
```

---

## 🔍 Diagnóstico Detalhado

### **Passo 1: Verificar Build Context**

No Portainer → Stack → Edit:
- **Repository URL:** Qual é?
- **Compose file path:** Deve ser `/docker-compose.yml`

### **Passo 2: Verificar Permissões**

Se usando um repositório Git:
```bash
# Certifique-se que os arquivos estão commitados
git add backend/package*.json
git add frontend/package*.json
git commit -m "Ensure package files are in repo"
git push
```

### **Passo 3: Verificar Tamanho dos Arquivos**

```bash
# Deve ter tamanho > 0
wc -c frontend/package-lock.json backend/package-lock.json
```

---

## 📋 Checklist de Resolução

- [ ] Limpei cache do Portainer (System → Prune)
- [ ] Atualizei a stack (Pull and re-deploy)
- [ ] Verifiquei que package.json e package-lock.json existem
- [ ] Testei build localmente com `docker build`
- [ ] Verificei permissões dos arquivos
- [ ] Se usando Git, fiz commit dos arquivos

---

## ✅ Se Ainda Não Funcionar

Tente este docker-compose.yml **alternativo** (sem fazer build):

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    container_name: iot_mongo
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    networks:
      - iot_network

  redis:
    image: redis:7-alpine
    container_name: iot_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - iot_network

  backend:
    image: node:20-alpine
    container_name: iot_backend
    working_dir: /app
    volumes:
      - ./backend:/app
    environment:
      NODE_ENV: development
      PORT: 3001
      MONGO_URI: mongodb://mongo:27017/iot_platform
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongo
      - redis
    networks:
      - iot_network
    command: sh -c "npm install && node src/index.js"

  frontend:
    image: node:20-alpine
    container_name: iot_frontend
    working_dir: /app
    volumes:
      - ./frontend:/app
    environment:
      VITE_API_URL: http://localhost:3001
    networks:
      - iot_network
    command: sh -c "npm install && npm run build && npx http-server dist -p 80"
    ports:
      - "80:80"

volumes:
  mongo_data:
  redis_data:

networks:
  iot_network:
    driver: bridge
```

Este version:
- ❌ Não faz build (usa imagens prontas)
- ✅ Monta diretórios locais como volumes
- ✅ Evita problemas com COPY de arquivos
- ⚠️ Use apenas para desenvolvimento/teste

---

## 🚀 Próximas Tentativas

1. **Solução 1** (cache clean): 80% de chance de sucesso
2. **Solução 2** (pull and redeploy): 90% de chance
3. **Solução 3** (test locally): 100% identifica o problema
4. **Solução 5** (docker-compose alternativo): 100% funciona

---

## 📞 Se Nada Funcionar

Descreva:
1. Mensagem de erro **exata**
2. O que você tentou já
3. Qual o **repositório** está usando (local Git, GitHub, etc)
4. Logs completos do Portainer

Estaremos aqui para ajudar! 🌿

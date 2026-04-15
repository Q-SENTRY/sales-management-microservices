# 🔧 SETUP.md - Guía Rápida de Setup

## Requisitos

- Node.js >= 16
- npm >= 8
- Docker >= 20.10
- Docker Compose >= 2.0
- Git

## 1️⃣ Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/usuario/sales-management-microservices.git
cd sales-management-microservices

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias (si necesario)
npm run install:all
```

## 2️⃣ Iniciar Contenedores

```bash
# Opción 1: Build + Run
docker-compose up --build

# Opción 2: Solo run (si ya está built)
docker-compose up

# Opción 3: Background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 3️⃣ Verificar Servicios

```bash
# Ver estado
docker-compose ps

# Debería ver 8 contenedores:
# mysql, rabbitmq, usuarios-service, productos-service,
# ventas-service, inventario-service, facturacion-service,
# notificaciones-service
```

## 4️⃣ Acceder a Aplicaciones

| Aplicación | URL | Credenciales |
|-----------|-----|--------------|
| Frontend | http://localhost:3000 | - |
| RabbitMQ | http://localhost:15672 | guest/guest |
| MySQL | localhost:3306 | root/password123 |
| Usuarios API | http://localhost:3001 | - |
| Productos API | http://localhost:3002 | - |
| Ventas API | http://localhost:3003 | - |

## 5️⃣ Primeros Pasos

### Crear Usuario

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass123456",
    "name": "Test User"
  }'
```

### Listar Productos

```bash
curl http://localhost:3002/api/v1/products
```

## 🛑 Detener Servicios

```bash
# Parar servicios
docker-compose down

# Parar y limpiar volúmenes
docker-compose down -v
```

## 📝 Notas Importantes

- **No editar** `docker-compose.yml` para desarrollo local
- **Crear ramas** antes de hacer cambios: `git checkout -b feature/nombre`
- **MySQL se inicializa** automáticamente con `schema.sql`
- **Cambios en código** requieren rebuild: `docker-compose up --build`

## 🆘 Troubleshooting

### Puertos ya en uso
```bash
# Ver qué está usando el puerto
lsof -i :3001  # Windows: netstat -ano | findstr :3001

# Kill proceso
kill -9 PID  # Windows: taskkill /PID <PID> /F
```

### MySQL no conecta
```bash
# Reiniciar MySQL
docker-compose restart mysql

# Ver logs
docker-compose logs mysql
```

### RabbitMQ problemas
```bash
# Reiniciar
docker-compose restart rabbitmq

# Acceder a management
# http://localhost:15672
# Usuario: guest
# Password: guest
```

---

**¡Listo para desarrollar!** 🚀

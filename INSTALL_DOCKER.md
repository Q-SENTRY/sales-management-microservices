# 📦 GUÍA: Cómo Instalar y Ejecutar el Proyecto

## ⚠️ Requerimiento: Docker Desktop

El proyecto NO está instalado en tu sistema. Necesitas **Docker Desktop** para ejecutar los 6 microservicios.

---

## 🐳 Paso 1: Descarga Docker Desktop

### Windows (Tu Sistema)

1. **Descarga Docker Desktop for Windows:**
   👉 https://www.docker.com/products/docker-desktop/

2. **Características necesarias:**
   - Windows 10/11 Home, Pro, Enterprise o Education
   - WSL 2 (Windows Subsystem for Linux 2)
   - Al menos 4 GB RAM
   - Virtualization habilitada en BIOS

3. **Instalación:**
   - Ejecuta el instalador descargado
   - Sigue los pasos del asistente
   - Marca "Install required Windows components"
   - La instalación puede tomar 10-15 minutos
   - Reinicia tu computadora después

---

## ✅ Paso 2: Verifica que Docker está Corriendo

1. Busca "Docker Desktop" en el menú Inicio
2. Haz clic para abrir
3. Espera a que aparezca el ícono en la bandeja del sistema (esquina inferior derecha)
4. El ícono debe estar de color VERDE (significa que está corriendo)
   - ✅ Verde = Corriendo
   - 🔴 Rojo = Error
   - ⚪ Gris = No está el servicio

---

## 🚀 Paso 3: Ejecuta el Proyecto

Una vez Docker Desktop esté ejecutándose (ícono verde):

**En PowerShell:**

```powershell
cd "c:\Users\user\Documents\PROYECTO SISTEMAS DISTRIBUIDOS\sales-management-microservices"
.\start-project.ps1
```

O simplemente:

```powershell
docker-compose up --build
```

---

## 📊 Paso 4: Espera a que Todo Inicie

Docker Compose iniciará 9 contenedores:

```
✓ MySQL 8.0                (base de datos)
✓ RabbitMQ 3.12            (message broker)
✓ Usuarios Service         (puerto 3001)
✓ Productos Service        (puerto 3002)
✓ Ventas Service           (puerto 3003)
✓ Inventario Service       (puerto 3004)
✓ Facturación Service      (puerto 3005)
✓ Notificaciones Service   (puerto 3006)
✓ Frontend React           (puerto 3000)
```

**Tiempo de inicio:** 2-5 minutos (depende de tu conexión y velocidad de disco)

---

## 🔗 Paso 5: Accede a los Servicios

Una vez que todo esté corriendo (verás en el terminal que dice "healthy"),  
abre en tu navegador:

| Servicio | URL |
|----------|-----|
| **Usuarios (Auth)** | http://localhost:3001 |
| **Productos** | http://localhost:3002 |
| **Ventas** | http://localhost:3003 |
| **Inventario** | http://localhost:3004 |
| **Facturación** | http://localhost:3005 |
| **Notificaciones** | http://localhost:3006 |
| **RabbitMQ Admin** | http://localhost:15672 |
| **MySQL** | localhost:3306 |

---

## 🧪 Paso 6: Prueba los Endpoints (Opcional)

### Opción A: Con Postman
1. Descarga https://www.postman.com/downloads/
2. Importa colección desde: `docs/postman-collection.json` (si existe)

### Opción B: Con curl en PowerShell

**Health Check:**
```powershell
curl http://localhost:3001/health
```

**Crear Usuario:**
```powershell
$body = @{
    nombre = "Juan Pérez"
    email = "juan@example.com"
    password = "Password123!"
    telefono = "1234567890"
} | ConvertTo-Json

curl -X POST http://localhost:3001/api/v1/auth/register `
     -ContentType "application/json" `
     -Body $body
```

---

## ⚙️ Comandos Útiles

```powershell
# Ver logs en tiempo real
docker-compose logs -f

# Ver solo logs de un servicio
docker-compose logs -f usuarios-service

# Detener todos los servicios
docker-compose down

# Detener y limpiar volúmenes
docker-compose down -v

# Reiniciar un servicio
docker-compose restart usuarios-service

# Ejecutar comando en un contenedor
docker-compose exec usuarios-service npm run dev
```

---

## 🆘 Problemas Comunes

### ❌ "Docker command not found"
→ Docker Desktop NO está instalado o en PATH
→ Desinstala completamente y reinstala

### ❌ "Port 3001 is already in use"
→ Otro servicio ocupa ese puerto
```powershell
# Encuentra qué usa el puerto
netstat -ano | findstr :3001
# O cambia los puertos en docker-compose.yml
```

### ❌ "Cannot connect to Docker daemon"
→ Docker Desktop Aún no está corriendo
→ Abrelo desde el menú Inicio y espera a que esté listo

### ❌ "WSL 2 not installed"
→ Necesitas instalar Windows Subsystem for Linux
→ Corre en PowerShell como Admin:
```powershell
wsl --install
```

---

## 📚 Documentación

- **README.md** - Descripción general del proyecto
- **docs/arquitectura.md** - Detalles técnicos
- **docs/ENDPOINTS.md** - Todos los endpoints disponibles
- **docs/flujo-ventas.md** - Flujo del proceso de compra
- **CONTRIBUTING.md** - Estándares de código
- **docker-compose.yml** - Configuración de servicios

---

## 🎯 Resumen

1. ✅ Descarga Docker Desktop
2. ✅ Instálalo y reinicia
3. ✅ Abre Docker Desktop (espera a que esté verde)
4. ✅ Corre el script:
   ```powershell
   docker-compose up --build
   ```
5. ✅ Accede a los servicios en los puertos indicados

---

**¿Necesitas ayuda adicional?**
- Consulta los logs: `docker-compose logs`
- Revisa la documentación en la carpeta `/docs`
- Verifica que los puertos 3000-3006 y 15672 estén disponibles

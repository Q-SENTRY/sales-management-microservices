# 🏢 Sales Management Microservices

Sistema profesional de gestión de ventas basado en **arquitectura de microservicios** con REST API, Docker, MySQL, React y Node.js.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Microservicios](#microservicios)
- [Puertos y Endpoints](#puertos-y-endpoints)
- [Configuración de Ramas Git](#configuración-de-ramas-git)
- [Roles del Equipo](#roles-del-equipo)
- [Flujo General de Compra](#flujo-general-de-compra)
- [Comunicación Entre Servicios](#comunicación-entre-servicios)
- [Base de Datos](#base-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Documentación Adicional](#documentación-adicional)
- [Buenas Prácticas](#buenas-prácticas)

---

## 🎯 Descripción General

Este proyecto implementa un sistema de gestión de ventas completo utilizando una arquitectura de **microservicios desacoplados**. Cada servicio es independiente, escalable y responsable de un dominio específico del negocio.

### Características Principales

✅ **Arquitectura de Microservicios** - Servicios independientes y escalables  
✅ **REST API** - Comunicación HTTP/JSON  
✅ **Docker & Docker Compose** - Containerización y orquestación  
✅ **MySQL** - Base de datos relacional centralizada  
✅ **Node.js & Express** - Backend profesional  
✅ **React** - Frontend moderno y responsivo  
✅ **Clean Architecture** - Separación clara de capas  
✅ **RabbitMQ** - Mensajería asíncrona (opcional)  
✅ **JWT** - Autenticación y autorización  
✅ **Swagger/OpenAPI** - Documentación automática de API  

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                           │
│                     (Port 3000)                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼────────────────────────────────────────┐
│             API GATEWAY (Optional)                          │
│         Load Balancer & Request Routing                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        │            │            │             │
┌───────▼──┐  ┌──────▼──┐  ┌─────▼────┐  ┌────▼─────┐
│ Usuarios │  │Productos│  │  Ventas  │  │Inventario│
│Service   │  │ Service │  │ Service  │  │ Service  │
│(3001)    │  │(3002)   │  │(3003)    │  │(3004)    │
└─────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘
      │            │            │             │
      │  ┌─────────┴────────┬───┴──────┐     │
      │  │                  │          │     │
┌─────▼──┴─┐         ┌──────▼──┐  ┌───▼──────┴──┐
│Facturación│         │Notificac│  │  RabbitMQ  │
│Service    │         │ Service │  │  (Queue) │
│(3005)     │         │(3006)   │  │(5672)     │
└───────────┘         └────┬────┘  └────────────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL 8.0  │
                    │   (3306)     │
                    │sales_mgmt_db  │
                    └──────────────┘
```

---

## 📁 Estructura de Carpetas

```
sales-management-microservices/
│
├── frontend-react/                 # Frontend React
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── usuarios-service/               # Gestión de usuarios y autenticación
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── middleware/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── productos-service/              # Gestión de productos
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── ventas-service/                 # Gestión de ventas/órdenes
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── events/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── inventario-service/             # Control de inventario
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── facturacion-service/            # Generación de facturas
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── pdf/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── notificaciones-service/         # Envío de notificaciones
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── email/
│   │   ├── sms/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── schema.sql                  # Schema inicial de la BD
│
├── docs/
│   ├── arquitectura.md             # Documentación de la arquitectura
│   └── flujo-ventas.md             # Flujo de procesos de ventas
│
├── .env.example                     # Variables de entorno ejemplo
├── .gitignore                       # Git ignore rules
├── docker-compose.yml              # Orquestación de containers
├── README.md                        # Este archivo
└── package.json                     # Scripts raíz

```

---

## 📦 Requisitos Previos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git** para control de versiones

### Verificar instalación

```bash
node --version
npm --version
docker --version
docker-compose --version
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sales-management-microservices.git
cd sales-management-microservices
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores locales (opcional para desarrollo local)

### 3. Iniciar todos los servicios con Docker

```bash
# Construir e iniciar todos los contenedores
docker-compose up --build

# O Solo iniciar (si ya están construidos)
docker-compose up

# En background
docker-compose up -d
```

### 4. Verificar que todos los servicios estén corriendo

```bash
docker-compose ps
```

Deberías ver 8 contenedores ejecutándose:
- `mysql`
- `rabbitmq`
- `usuarios-service`
- `productos-service`
- `ventas-service`
- `inventario-service`
- `facturacion-service`
- `notificaciones-service`

### 5. Acceso a las aplicaciones

- **Frontend**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (usuario: guest, password: guest)
- **MySQL**: localhost:3306

---

## 🔧 Microservicios

### 1. **Usuarios Service** (Port 3001)
Gestión de usuarios, autenticación y autorización.

**Responsabilidades:**
- Registro y login de usuarios
- Gestión de perfiles
- JWT tokens
- Roles y permisos

**Tecnología Stack:**
- Express.js
- MySQL
- JWT
- bcryptjs

---

### 2. **Productos Service** (Port 3002)
Gestión del catálogo de productos.

**Responsabilidades:**
- CRUD de productos
- Categorías
- Búsqueda y filtrado
- Stock por producto

**Tecnología Stack:**
- Express.js
- MySQL

---

### 3. **Ventas Service** (Port 3003)
Gestión de órdenes y ventas.

**Responsabilidades:**
- Crear órdenes
- Consultar órdenes
- Estados de órdenes
- Historial de ventas

**Comunicación:**
- Publica eventos a RabbitMQ
- Consume eventos de inventario

---

### 4. **Inventario Service** (Port 3004)
Control de stock e inventario.

**Responsabilidades:**
- Actualizar stock
- Reservas de productos
- Alertas de bajo stock
- Movimientos de inventario

**Comunicación:**
- Suscrito a eventos de ventas
- Publica eventos de stock

---

### 5. **Facturación Service** (Port 3005)
Generación de facturas.

**Responsabilidades:**
- Crear facturas
- Generar PDF
- Historial de facturas
- Informes

**Comunicación:**
- Suscrito a eventos de ventas completadas

---

### 6. **Notificaciones Service** (Port 3006)
Sistema de notificaciones.

**Responsabilidades:**
- Envío de emails
- SMS (opcional)
- Notificaciones push
- Logs de notificaciones

**Comunicación:**
- Suscrito a eventos de múltiples servicios
- Integración con proveedores externos

---

## 🌐 Puertos y Endpoints

### Puertos de Servicios

| Servicio | Puerto | Base URL |
|----------|--------|----------|
| Frontend React | 3000 | http://localhost:3000 |
| Usuarios | 3001 | http://localhost:3001/api/v1 |
| Productos | 3002 | http://localhost:3002/api/v1 |
| Ventas | 3003 | http://localhost:3003/api/v1 |
| Inventario | 3004 | http://localhost:3004/api/v1 |
| Facturación | 3005 | http://localhost:3005/api/v1 |
| Notificaciones | 3006 | http://localhost:3006/api/v1 |
| MySQL | 3306 | localhost:3306 |
| RabbitMQ | 5672 | localhost:5672 |
| RabbitMQ UI | 15672 | http://localhost:15672 |

### Endpoints Planeados por Servicio

#### Usuarios Service (3001)

```
POST   /api/v1/auth/register          - Registro de usuario
POST   /api/v1/auth/login             - Login
POST   /api/v1/auth/refresh           - Renovar token
GET    /api/v1/users                  - Listar usuarios (admin)
GET    /api/v1/users/:id              - Obtener usuario
PUT    /api/v1/users/:id              - Actualizar usuario
DELETE /api/v1/users/:id              - Eliminar usuario
GET    /api/v1/profile                - Obtener perfil actual
PUT    /api/v1/profile                - Actualizar perfil
POST   /api/v1/roles                  - Crear rol (admin)
GET    /api/v1/roles                  - Listar roles
```

#### Productos Service (3002)

```
GET    /api/v1/products               - Listar productos
GET    /api/v1/products/:id           - Obtener producto
POST   /api/v1/products               - Crear producto
PUT    /api/v1/products/:id           - Actualizar producto
DELETE /api/v1/products/:id           - Eliminar producto
GET    /api/v1/categories             - Listar categorías
POST   /api/v1/categories             - Crear categoría
GET    /api/v1/products/search        - Buscar productos
GET    /api/v1/products/category/:cat - Productos por categoría
```

#### Ventas Service (3003)

```
POST   /api/v1/orders                 - Crear orden
GET    /api/v1/orders                 - Listar órdenes
GET    /api/v1/orders/:id             - Obtener orden
PUT    /api/v1/orders/:id             - Actualizar orden
DELETE /api/v1/orders/:id             - Cancelar orden
GET    /api/v1/orders/:id/items       - Items de la orden
POST   /api/v1/orders/:id/items       - Agregar item a orden
PUT    /api/v1/orders/:id/status      - Actualizar estado
GET    /api/v1/sales/report           - Reporte de ventas
GET    /api/v1/sales/by-date          - Ventas por fecha
```

#### Inventario Service (3004)

```
GET    /api/v1/inventory              - Estado actual del inventario
GET    /api/v1/inventory/:product_id  - Stock de producto
PUT    /api/v1/inventory/:product_id  - Actualizar stock
POST   /api/v1/reservations           - Crear reserva
DELETE /api/v1/reservations/:id       - Cancelar reserva
GET    /api/v1/movements              - Historial de movimientos
POST   /api/v1/adjustments            - Ajuste de inventario
GET    /api/v1/alerts/low-stock       - Productos con bajo stock
```

#### Facturación Service (3005)

```
POST   /api/v1/invoices               - Crear factura
GET    /api/v1/invoices               - Listar facturas
GET    /api/v1/invoices/:id           - Obtener factura
GET    /api/v1/invoices/:id/pdf       - Descargar PDF
PUT    /api/v1/invoices/:id/status    - Actualizar estado
POST   /api/v1/invoices/:id/send      - Enviar por email
GET    /api/v1/reports/revenue        - Reporte de ingresos
GET    /api/v1/reports/tax            - Reporte fiscal
```

#### Notificaciones Service (3006)

```
POST   /api/v1/notifications/email    - Enviar email
POST   /api/v1/notifications/sms      - Enviar SMS
POST   /api/v1/notifications/push     - Enviar notificación push
GET    /api/v1/notifications/logs     - Logs de notificaciones
GET    /api/v1/notifications/logs/:id - Detalle de notificación
PUT    /api/v1/notifications/logs/:id - Marcar como leído
GET    /api/v1/templates              - Listar plantillas
```

---

## 🌳 Configuración de Ramas Git

Se recomienda usar **Git Flow** para control de versiones:

### Ramas Principales

```
main (production)
├── develop (desarrollo)
├── feature/usuarios (Dev 1)
├── feature/productos (Dev 2)
├── feature/ventas-inventario (Dev 3)
├── bugfix/nombre-bug
└── hotfix/nombre-hotfix
```

### Estrategia de Ramas

**`main`** - Producción
- Código estable y testeado
- Solo merges de `release` y `hotfix`
- Protegida, requiere pull requests

**`develop`** - Integración
- Rama base para desarrollo
- Código de staging
- Donde se integran todas las features

**`feature/nombre`** - Features por desarrollador
- Creadas desde: `develop`
- Trabaja un solo desarrollador
- Merge a `develop` mediante pull request

**`hotfix/nombre`** - Correcciones de producción
- Creadas desde: `main`
- Merge a `main` y `develop`

### Crear una Feature

```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Crear feature
git checkout -b feature/usuarios

# Hacer commits
git add .
git commit -m "feat: agregar endpoint de login"

# Subir feature
git push origin feature/usuarios

# Crear pull request en GitHub
# Revisar código y merge a develop
```

---

## 👥 Roles del Equipo

Se recomienda asignar a los 3 desarrolladores de la siguiente manera:

### Desarrollador 1: **Gestión de Usuarios**
- **Responsabilidades:**
  - Usuarios Service (3001)
  - Autenticación y autorización
  - JWT tokens
  - Middleware de seguridad
  - Roles y permisos
  
- **Rama Git:** `feature/usuarios`
- **Skills:** Node.js, Express, MySQL, Seguridad

---

### Desarrollador 2: **Catálogo y Productos**
- **Responsabilidades:**
  - Productos Service (3002)
  - CRUD de productos
  - Categorías y búsqueda
  - Frontend - Catálogo
  - Integración con Usuarios
  
- **Rama Git:** `feature/productos`
- **Skills:** Node.js, Express, React, MySQL

---

### Desarrollador 3: **Ventas e Inventario**
- **Responsabilidades:**
  - Ventas Service (3003)
  - Inventario Service (3004)
  - Facturación Service (3005)
  - Notificaciones Service (3006)
  - Integración inter-servicios
  - Comunicación asíncrona (RabbitMQ)
  
- **Rama Git:** `feature/ventas-inventario`
- **Skills:** Node.js, Express, MySQL, RabbitMQ, Event-driven

---

## 🔄 Flujo General de Compra

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE                                  │
│                  (React Frontend)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
   Autenticarse              Ver Productos
   (Usuario Service)         (Productos Service)
        │                          │
        └────────────┬─────────────┘
                     │
                  Agregar al carrito
                     │
                     ▼
              Crear Orden
              (Ventas Service)
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
   Reservar Stock            Validar Inventario
   (Inventario Service)      (Inventario Service)
        │                          │
        └────────────┬─────────────┘
                     │
              ¿Stock disponible?
                  Sí    │    No
                   │    │    │
                   │    │    ├─► Error: Sin stock
                   │    │    │
                   ▼    │    │
              Procesar Pago
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
   ¿Pago OK?         Ordenar Factura
    Sí │ No          (Facturación Service)
      │ │                  │
      │ └─► Cancelar       │
      │     Reserva        ▼
      │                Enviar Email
      ▼                (Notificaciones Service)
   Actualizar                │
   Estado Orden              ▼
   (Ventas Service)       Orden Completada
      │
      └─► Publicar Evento RabbitMQ
          (Orden Completada)
          │
          └─► Confirmar Reserva Inventario
```

---

## 💬 Comunicación Entre Servicios

### Síncrona (HTTP REST)

```
Usuario Service  <--HTTP--> Productos Service
Ventas Service   <--HTTP--> Inventario Service
Frontend React   <--HTTP--> Todos los servicios
```

### Asíncrona (RabbitMQ)

```
Ventas Service (Publica)
    ├─► evento.orden.creada
    └─► evento.orden.pagada
         ↓
      RabbitMQ (Broker)
         ↓
    ┌────┴────┬────────┬──────────┐
    ▼         ▼        ▼          ▼
Inventario Facturación Notificaciones (Suscritos)
(Actualiza) (Genera)    (Envía)
```

**Eventos Planeados:**
- `orden.creada` - Cuando se crea una orden
- `orden.pagada` - Cuando se confirma el pago
- `orden.entregada` - Cuando se entrega
- `stock.actualizado` - Cambios en inventario
- `reserva.confirmada` - Reserva aceptada
- `reserva.cancelada` - Reserva cancelada
- `factura.generada` - Factura creada

---

## 🗄️ Base de Datos

### Estructura General

```
sales_management_db
├── usuarios
├── roles
├── permisos
├── productos
├── categorias
├── ordenes
├── orden_items
├── inventario
├── reservas
├── movimientos_inventario
├── facturas
├── notificaciones
└── logs
```

Ver detalles en: [database/schema.sql](./database/schema.sql)

### Conexión

```
Host: localhost (o mysql en Docker)
Port: 3306
Database: sales_management_db
User: sales_user
Password: user_password123
```

---

## 🔐 Variables de Entorno

Todas las variables están listadas en `.env.example`

**Recuerda:** NUNCA commits `.env` con datos sensibles, solo `.env.example`

---

## 📚 Documentación Adicional

- [Arquitectura Detallada](./docs/arquitectura.md) - Diseño de la arquitectura
- [Flujo de Ventas](./docs/flujo-ventas.md) - Procesos de negocio
- API Swagger (En desarrollo)

---

## ✅ Buenas Prácticas Implementadas

### 1. **Clean Architecture**
- Separación clara de capas: Controllers → Services → Models
- Cada capa con responsabilidad definida
- Fácil de testear y mantener

### 2. **Separación por Microservicios**
- Cada servicio = dominio de negocio
- Independencia y escalabilidad
- Desarrollo paralelo de equipos

### 3. **Nomenclatura Profesional**
- Nombres descriptivos y consistentes
- Métodos en inglés
- Comentarios en el código

### 4. **Control de Versiones**
- Versionado semántico (v1, v2...)
- API versioned routes (`/api/v1/`)
- Fácil de realizar cambios sin romper clientes

### 5. **Docker & Containerización**
- Reproducibilidad
- Fácil deploy
- Entorno consistente

### 6. **Comunicación Asíncrona**
- RabbitMQ para eventos
- Desacoplamiento de servicios
- Mayor resilencia

### 7. **Seguridad**
- JWT para autenticación
- Hashing de contraseñas
- Validación de inputs
- CORS configurado

### 8. **Escalabilidad**
- Stateless services
- Fácil de replicar
- Load balancing ready

---

## 📝 Commit Message Convention

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     Agregación de nueva funcionalidad
fix:      Corrección de bugs
docs:     Cambios en documentación
style:    Cambios de formato (sin lógica)
refactor: Refactorización de código
perf:     Mejoras de performance
test:     Agregar tests
chore:    Cambios en build o dependencies
```

**Ejemplos:**
```bash
git commit -m "feat: agregar endpoint POST /usuarios"
git commit -m "fix: corregir validación en login"
git commit -m "docs: actualizar README"
```

---

## 🆘 Solución de Problemas

### Los servicios no inician

```bash
# Ver logs detallados
docker-compose logs -f

# Reconstruir todo
docker-compose down -v
docker-compose up --build
```

### Puerto ya está en uso

```bash
# Cambiar puerto en docker-compose.yml o .env
# Reiniciar Docker
docker-compose restart
```

### Base de datos con errores

```bash
# Resetear base de datos
docker-compose exec mysql mysql -u root -ppassword123 -e "DROP DATABASE sales_management_db;"
docker-compose restart mysql
```

---

## 🚢 Próximos Pasos (Roadmap)

- [ ] Implementar API Gateway (Kong o Express Gateway)
- [ ] Agregar Swagger/OpenAPI en todos los servicios
- [ ] Tests unitarios por servicio
- [ ] Tests de integración
- [ ] CI/CD con GitHub Actions
- [ ] Monitoring y Logging (ELK Stack)
- [ ] Caché con Redis
- [ ] GraphQL (alternativa a REST)
- [ ] Documentación Swagger completa
- [ ] Deployment en Kubernetes

---

## 📄 Licencia

MIT License - Libre para usar y modificar

---

## 👨‍💼 Soporte

Para preguntas o problemas:
1. Revisar la documentación en `/docs`
2. Crear un issue en GitHub
3. Contactar al equipo de desarrollo

---

**Construido con ❤️ por un equipo de desarrolladores profesionales**

Última actualización: 2024

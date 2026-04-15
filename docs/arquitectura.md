# 🏗️ Arquitectura del Sistema - Sales Management Microservices

## Visión General

Este documento describe la arquitectura técnica del sistema de gestión de ventas basado en microservicios.

## 1. Principios Arquitectónicos

### Clean Architecture
- **Separación de capas:** Controllers → Services → Models
- **Independencia de frameworks:** Lógica de negocio desacoplada de tecnologías
- **Testabilidad:** Cada capa es testeable independientemente
- **Mantenibilidad:** Cambios aislados a funcionalidades específicas

### Arquitectura de Microservicios
- **Servicios desacoplados:** Cada servicio es independiente
- **Escalabilidad horizontal:** Replicar servicios sin afectar otros
- **Fallback resilientes:** Si un servicio falla, otros continúan funcionando
- **Desarrollo paralelo:** Equipos trabajan sin bloqueos

---

## 2. Componentes Principales

### 2.1 Frontend - React (Puerto 3000)

```
┌─────────────────────────────────────────┐
│           React Application             │
│   - Dashboard                           │
│   - Gestión de Productos                │
│   - Carrito de Compras                  │
│   - Historial de Órdenes                │
│   - Facturación                         │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │  API Calls (HTTP)       │
        │  JSON Format            │
        └────────────┬────────────┘
                     │
              Microservicios
```

**Responsabilidades:**
- Interfaz de usuario responsiva
- Validación en cliente
- Almacenamiento local (localStorage)
- Comunicación con todas las APIs

**Tecnologías:**
- React 18+
- Axios para HTTP
- React Router para navegación
- Estado global (Context API o Redux)

---

### 2.2 Usuarios Service (Puerto 3001)

```
┌───────────────────────────────┐
│    Usuarios Service           │
├───────────────────────────────┤
│ Controllers                   │
│  - register                   │
│  - login                      │
│  - refreshToken               │
│  - getProfile                 │
├───────────────────────────────┤
│ Services (Business Logic)     │
│  - AuthService                │
│  - UserService                │
├───────────────────────────────┤
│ Models (Data Access)          │
│  - UserModel                  │
├───────────────────────────────┤
│ Middleware                    │
│  - Authentication (JWT)       │
│  - Authorization              │
│  - Error Handling             │
└───────────┬───────────────────┘
            │
         MySQL
```

**Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

**Base de datos:**
```sql
usuarios (id, email, password, name, created_at)
roles (id, name, description)
permisos (id, name, description)
usuario_roles (usuario_id, rol_id)
```

---

### 2.3 Productos Service (Puerto 3002)

```
┌───────────────────────────────┐
│    Productos Service          │
├───────────────────────────────┤
│ Controllers                   │
│  - getAll                     │
│  - getByCategory              │
│  - search                     │
│  - getCatalog                 │
├───────────────────────────────┤
│ Services                      │
│  - ProductService             │
│  - CategoryService            │
├───────────────────────────────┤
│ Models                        │
│  - ProductModel               │
│  - CategoryModel              │
└───────────┬───────────────────┘
            │
         MySQL
```

**Endpoints:**
```
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/categories
GET    /api/v1/products/search
```

**Tablas:**
```sql
productos (id, nombre, descripcion, precio, stock, categoria_id)
categorias (id, nombre, descripcion)
```

---

### 2.4 Ventas Service (Puerto 3003)

Responsable de:
- Crear órdenes
- Gestionar estados de órdenes
- Publicar eventos a RabbitMQ

```
┌──────────────────────────────────┐
│      Ventas Service              │
├──────────────────────────────────┤
│ Controllers                      │
│  - createOrder                   │
│  - getOrders                     │
│  - updateOrderStatus             │
├──────────────────────────────────┤
│ Services                         │
│  - OrderService                  │
│  - EventPublisher (RabbitMQ)     │
├──────────────────────────────────┤
│ Models                           │
│  - OrderModel                    │
└─────────┬──────────────┬─────────┘
          │              │
       MySQL        RabbitMQ
                      │
                  Publicar:
                  - orden.creada
                  - orden.pagada
```

**Tablas:**
```sql
ordenes (id, usuario_id, fecha, estado, total)
orden_items (id, orden_id, producto_id, cantidad, precio)
```

---

### 2.5 Inventario Service (Puerto 3004)

Responsable de:
- Controlar stock de productos
- Reservar stock para órdenes
- Suscribirse a eventos de ventas

```
┌──────────────────────────────────┐
│    Inventario Service            │
├──────────────────────────────────┤
│ Controllers                      │
│  - getInventory                  │
│  - getProductStock               │
│  - reserveStock                  │
│  - adjustStock                   │
├──────────────────────────────────┤
│ Services                         │
│  - InventoryService              │
│  - EventSubscriber (RabbitMQ)    │
├──────────────────────────────────┤
│ Models                           │
│  - InventoryModel                │
└─────────┬──────────────┬─────────┘
          │              │
       MySQL        RabbitMQ
                      │
                  Suscrito a:
                  - orden.pagada
                  - Publica:
                  - stock.actualizado
```

**Tablas:**
```sql
inventario (id, producto_id, cantidad)
movimientos_inventario (id, producto_id, tipo, cantidad, fecha)
reservas (id, orden_id, producto_id, cantidad)
```

---

### 2.6 Facturación Service (Puerto 3005)

Responsable de:
- Generar facturas
- Crear PDFs
- Suscribirse a eventos de órdenes completadas

```
┌──────────────────────────────────┐
│    Facturación Service           │
├──────────────────────────────────┤
│ Controllers                      │
│  - createInvoice                 │
│  - getInvoices                   │
│  - downloadPDF                   │
├──────────────────────────────────┤
│ Services                         │
│  - InvoiceService                │
│  - PDFGenerator                  │
│  - EventSubscriber               │
├──────────────────────────────────┤
│ Models                           │
│  - InvoiceModel                  │
└─────────┬──────────────┬─────────┘
          │              │
       MySQL        RabbitMQ
```

**Tablas:**
```sql
facturas (id, orden_id, numero, fecha, total)
```

---

### 2.7 Notificaciones Service (Puerto 3006)

Responsable de:
- Enviar emails
- Enviar SMS
- Enviar notificaciones push
- Suscribirse a eventos de múltiples servicios

```
┌──────────────────────────────────┐
│   Notificaciones Service         │
├──────────────────────────────────┤
│ Controllers                      │
│  - sendEmail                     │
│  - sendSMS                       │
│  - sendPush                      │
├──────────────────────────────────┤
│ Services                         │
│  - EmailService                  │
│  - SMSService (Twilio)           │
│  - PushService                   │
│  - EventSubscriber               │
├──────────────────────────────────┤
│ Models                           │
│  - NotificationLogModel          │
└─────────┬──────────────┬─────────┘
          │              │
       MySQL        RabbitMQ
                      │
                  Suscrito a:
                  - orden.creada
                  - orden.pagada
                  - factura.generada
```

**Tablas:**
```sql
notificaciones (id, tipo, destinatario, asunto, cuerpo, estado, fecha)
```

---

## 3. Base de Datos

### Diseño
- **MySQL 8.0** - Base de datos relacional centralizada
- **Una BD compartida** por todos los servicios
- **Normalización:** 3FN
- **Integridad referencial** mediante constraints

### Estrategia de Acceso
- Cada servicio accede solo a sus tablas específicas
- No hay llamadas SQL atravesadas entre servicios
- Para datos de otros servicios → Llamadas HTTP REST

---

## 4. Comunicación Entre Servicios

### 4.1 Comunicación Síncrona (HTTP REST)

```
Frontend ──HTTP──→ Usuarios Service
             ─────→ Productos Service
             ─────→ Ventas Service
             ─────→ Inventario Service
```

**Características:**
- Respuesta inmediata
- Request-Response
- Protocolo HTTP/JSON
- Timeout configurado

**Ejemplo:**
```javascript
// Desde Ventas Service a Inventario Service
const axios = require('axios');
const response = await axios.get('http://inventario-service:3004/api/v1/inventory/123');
```

---

### 4.2 Comunicación Asíncrona (RabbitMQ)

```
┌──────────────────────────────────────────────────────────┐
│                    RabbitMQ Broker                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Exchanges (Tópicos)                                    │
│  ├─ ventas.events                                       │
│  ├─ inventario.events                                   │
│  ├─ facturacion.events                                  │
│  └─ notificaciones.events                               │
│                                                          │
│  Queues (Consumidores)                                  │
│  ├─ orden.creada.queue                                  │
│  ├─ orden.pagada.queue                                  │
│  └─ stock.actualizado.queue                             │
└──────────────────────────────────────────────────────────┘
```

**Event Lifecycle:**
```
Ventas Service
    │
    ├─→ Publica: 'orden.pagada'
    │       │
    │       └─→ RabbitMQ Broker
    │               │
    │               ├─→ Inventario Service (Consume)
    │               ├─→ Facturación Service (Consume)
    │               └─→ Notificaciones Service (Consume)
    │
    └─→ Continúa sin esperar
```

**Ventajas:**
- Desacoplamiento
- Escalabilidad
- Resiliencia
- Procesamiento asíncrono

---

## 5. Patrones de Diseño

### 5.1 Repository Pattern

```javascript
// Abstracción de acceso a datos
class UserRepository {
  async findById(id) { ... }
  async findByEmail(email) { ... }
  async create(data) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
}
```

### 5.2 Service Layer Pattern

```javascript
// Lógica de negocio centralizada
class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(userData) {
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) throw new Error('Email exists');
    
    const hashed = await hash(userData.password);
    return this.userRepository.create({ ...userData, password: hashed });
  }
}
```

### 5.3 Dependency Injection

```javascript
// Inyección de dependencias
const userRepository = new UserRepository(database);
const authService = new AuthService(userRepository);
```

---

## 6. Seguridad

### 6.1 Autenticación

**JWT (JSON Web Tokens)**
```
Login → Token JWT → Guardar en client
Header: Authorization: Bearer <token>
Verificación en cada request
```

### 6.2 Autorización

**Roles y Permisos**
```
ADMIN
├─ crear_usuarios
├─ eliminar_usuarios
└─ ver_reportes

USUARIO
├─ comprar
├─ ver_ordenes
└─ descargar_facturas

VENDEDOR
├─ crear_productos
├─ ver_inventario
└─ procesar_devoluciones
```

### 6.3 Validación

```javascript
// Esquema Joi
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required()
});

const { error, value } = schema.validate(req.body);
if (error) throw error;
```

---

## 7. Escalabilidad

### 7.1 Horizontal Scaling

```
    ┌─────────────┐
    │   Load      │
    │  Balancer   │
    └──────┬──────┘
           │
    ┌──────┼──────┐
    │      │      │
┌───▼──┐ ┌─▼───┐ ┌─▼───┐
│ Inst │ │Inst │ │Inst │  Usuarios Service
│  1   │ │ 2   │ │ 3   │
└──┬───┘ └──┬──┘ └──┬──┘
   │        │       │
   └────────┼───────┘
            │
          MySQL
```

### 7.2 Caching

```
Frontend
    │
    ├─→ Redis Cache
    │       (TTL: 5 min)
    │       (Key: product:123)
    │       (Value: {id, name, price})
    │
    └─→ Productos Service
             │
             └─→ MySQL (solo si no está en cache)
```

---

## 8. Monitoreo y Logging

### 8.1 Health Checks

```
GET /health
{
  "status": "ok",
  "service": "usuarios-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 8.2 Logging

```
[2024-01-15T10:30:00Z] [INFO] ✅ Usuarios Service escuchando en puerto 3001
[2024-01-15T10:30:05Z] [INFO] Usuario registrado: user@example.com
[2024-01-15T10:30:10Z] [ERROR] Error al conectar a MySQL
```

### 8.3 Métricas Future

- Response times
- Error rates
- Throughput
- Database queries
- RabbitMQ queue lengths

---

## 9. Flujo de Deployment

```
┌──────────────┐
│  Desarrollo  │         ┌──────────┐
│  Local (docker)   ───→ │ Git Push │
└──────────────┘         └────┬─────┘
                               │
                         ┌─────▼──────┐
                         │ CI/CD      │
                         │ Pipeline   │
                         │ (GitHub    │
                         │  Actions)  │
                         └─────┬──────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────▼─┐  ┌──┴──┐  ┌─────▼──┐
              │ Testing│  │Build│  │Push to │
              │        │  │Image│  │Registry│
              └────────┘  └─────┘  └────────┘
                                       │
                          ┌────────────▼───────┐
                          │ Deploy a Production│
                          │ (Kubernetes)       │
                          └────────────────────┘
```

---

## 10. Próximas Mejoras

- [ ] API Gateway (Kong)
- [ ] Service Mesh (Istio)
- [ ] Kubernetes Deployment
- [ ] Prometheus + Grafana
- [ ] ELK Stack (Logging)
- [ ] Circuit Breaker
- [ ] Rate Limiting
- [ ] GraphQL API

---

**Última actualización:** 2024

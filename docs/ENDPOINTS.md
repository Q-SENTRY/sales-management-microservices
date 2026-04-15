# 📋 Endpoints Planeados - API Documentation

## Overview

Este documento lista todos los endpoints planeados por microservicio con métodos HTTP, parámetros, respuestas y códigos de estado.

**Base URL:** `http://localhost:PORT/api/v1`

---

## 🔐 Usuarios Service (Port 3001)

### Authentication Endpoints

#### POST /auth/register
Registrar nuevo usuario

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Juan",
  "apellido": "Pérez",
  "telefono": "+34612345678"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Juan",
    "apellido": "Pérez"
  }
}
```

**Errors:**
- `400` - Email ya registrado
- `422` - Validación fallida

---

#### POST /auth/login
Iniciar sesión

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Juan"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `401` - Credenciales inválidas
- `400` - Email o password requeridos

---

#### POST /auth/refresh
Renovar token JWT

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token renovado",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### User Management Endpoints

#### GET /users
Listar todos los usuarios

**Query Params:**
- `page=1` (opcional)
- `limit=10` (opcional)
- `search=keyword` (opcional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "Juan",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "total": 50,
  "page": 1
}
```

---

#### GET /users/:id
Obtener usuario específico

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Juan",
    "apellido": "Pérez",
    "telefono": "+34612345678",
    "activo": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `404` - Usuario no encontrado

---

#### PUT /users/:id
Actualizar usuario

**Request:**
```json
{
  "name": "Juan Carlos",
  "telefono": "+34987654321"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Usuario actualizado",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Juan Carlos"
  }
}
```

---

#### DELETE /users/:id
Eliminar usuario

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Usuario eliminado"
}
```

---

## 🛍️ Productos Service (Port 3002)

### Product Endpoints

#### GET /products
Listar productos

**Query Params:**
- `page=1`
- `limit=20`
- `categoria_id=1` (opcional)
- `search=keyword` (opcional)
- `orden=precio_asc|precio_desc|nombre`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Laptop Dell XPS",
      "precio": 1200.00,
      "categoria": "Electrónica",
      "stock": 15,
      "imagen_url": "https://example.com/image.jpg"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

#### GET /products/:id
Obtener producto específico

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Laptop Dell XPS",
    "descripcion": "Laptop de última generación...",
    "precio": 1200.00,
    "precio_costo": 800.00,
    "categoria_id": 1,
    "categoria": "Electrónica",
    "sku": "DELL-XPS-001",
    "marca": "Dell",
    "stock": 15,
    "activo": true,
    "descontinuado": false,
    "imagen_url": "https://example.com/image.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### POST /products
Crear producto (Admin only)

**Request:**
```json
{
  "nombre": "Laptop Dell XPS",
  "descripcion": "Laptop de última generación",
  "precio": 1200.00,
  "precio_costo": 800.00,
  "categoria_id": 1,
  "sku": "DELL-XPS-001",
  "marca": "Dell",
  "modelo": "XPS 13",
  "imagen_url": "https://example.com/image.jpg"
}
```

**Response:** `201 Created`

---

#### PUT /products/:id
Actualizar producto (Admin only)

**Response:** `200 OK`

---

#### DELETE /products/:id
Eliminar producto (Admin only)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Producto eliminado"
}
```

---

### Category Endpoints

#### GET /categories
Listar categorías

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Electrónica",
      "descripcion": "Productos electrónicos",
      "producto_count": 45
    }
  ]
}
```

---

#### POST /categories
Crear categoría (Admin only)

---

## 💰 Ventas Service (Port 3003)

### Order Endpoints

#### POST /orders
Crear nueva orden

**Request:**
```json
{
  "usuario_id": 1,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 1200.00
    }
  ],
  "total": 2400.00,
  "metodo_pago": "tarjeta",
  "direccion_envio": "Calle Principal 123",
  "ciudad": "Madrid",
  "codigo_postal": "28001"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": 123,
    "numero_orden": "ORD-20240115-ABC123",
    "usuario_id": 1,
    "total": 2400.00,
    "estado": "pendiente",
    "fecha": "2024-01-15T10:35:00Z"
  }
}
```

**Errors:**
- `400` - Datos inválidos
- `422` - Validación fallida

---

#### GET /orders
Listar órdenes del usuario

**Query Params:**
- `page=1`
- `limit=10`
- `estado=pagada|pendiente` (opcional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "numero_orden": "ORD-20240115-ABC123",
      "total": 2400.00,
      "estado": "pagada",
      "fecha": "2024-01-15T10:35:00Z",
      "cantidad_items": 2
    }
  ],
  "total": 25
}
```

---

#### GET /orders/:id
Obtener detalles de orden

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 123,
    "numero_orden": "ORD-20240115-ABC123",
    "usuario_id": 1,
    "total": 2400.00,
    "estado": "pagada",
    "items": [
      {
        "producto_id": 1,
        "nombre": "Laptop Dell XPS",
        "cantidad": 2,
        "precio_unitario": 1200.00,
        "subtotal": 2400.00
      }
    ]
  }
}
```

---

#### PUT /orders/:id/status
Actualizar estado de orden (Admin)

**Request:**
```json
{
  "estado": "enviada"
}
```

**Response:** `200 OK`

---

## 📦 Inventario Service (Port 3004)

### Inventory Endpoints

#### GET /inventory
Ver estado completo del inventario

**Query Params:**
- `estado=bajo|normal|alto` (opcional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "producto_id": 1,
      "nombre": "Laptop Dell XPS",
      "cantidad": 15,
      "cantidad_minima": 10,
      "estado": "normal"
    }
  ]
}
```

---

#### GET /inventory/:product_id
Obtener stock de producto específico

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "producto_id": 1,
    "nombre": "Laptop Dell XPS",
    "cantidad": 15,
    "cantidad_minima": 10,
    "cantidad_maxima": 100,
    "ubicacion": "A-5-3",
    "estado": "normal"
  }
}
```

---

#### POST /inventory/reserve
Reservar stock para una orden

**Request:**
```json
{
  "orden_id": 123,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Stock reservado",
  "data": {
    "reserva_id": 456,
    "items_reservados": 1,
    "items_fallidos": 0
  }
}
```

---

#### POST /inventory/adjust
Ajustar stock (Admin)

**Request:**
```json
{
  "producto_id": 1,
  "cantidad": -5,
  "motivo": "Daño en almacén"
}
```

**Response:** `200 OK`

---

## 📄 Facturación Service (Port 3005)

### Invoice Endpoints

#### POST /invoices
Crear factura (Automático desde evento)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero_factura": "FA-2024-00001",
    "orden_id": 123,
    "total": 2400.00,
    "estado": "emitida"
  }
}
```

---

#### GET /invoices
Listar facturas

**Query Params:**
- `page=1`
- `limit=10`
- `estado=emitida|pagada`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_factura": "FA-2024-00001",
      "total": 2400.00,
      "fecha": "2024-01-15T10:35:00Z",
      "estado": "emitida"
    }
  ]
}
```

---

#### GET /invoices/:id/pdf
Descargar PDF de factura

**Response:** `200 OK` (PDF binario)

---

## 🔔 Notificaciones Service (Port 3006)

### Notification Endpoints

#### POST /notifications/email
Enviar email

**Request:**
```json
{
  "para": "usuario@example.com",
  "asunto": "Tu factura #FA-2024-00001",
  "cuerpo": "Adjunto encontrarás tu factura..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "mensaje": "Email enviado",
  "notificacion_id": 1
}
```

---

#### POST /notifications/sms
Enviar SMS

**Request:**
```json
{
  "numero": "+34612345678",
  "mensaje": "Tu orden ha sido entregada"
}
```

**Response:** `200 OK`

---

#### GET /notifications/logs
Ver logs de notificaciones

**Query Params:**
- `tipo=email|sms`
- `estado=enviada|fallida`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo": "email",
      "destinatario": "user@example.com",
      "estado": "enviada",
      "fecha": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

## 📊 Estados HTTP Estándar

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Operación exitosa sin contenido |
| 400 | Bad Request - Solicitud inválida |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Validación fallida |
| 500 | Internal Server Error - Error del servidor |
| 503 | Service Unavailable - Servicio no disponible |

---

## 🔐 Autenticación

Todos los endpoints (excepto `/auth/register` y `/auth/login`) requieren:

```
Authorization: Bearer <JWT_TOKEN>
```

**Header requerido:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta sin token:**
```javascript
{
  "success": false,
  "error": "Token no proporcionado"
}
```

---

## 🚀 Próximas Implementaciones

- [ ] Swagger/OpenAPI integrado
- [ ] Postman collection
- [ ] GraphQL API alternativa
- [ ] Webhooks para eventos
- [ ] Rate limiting
- [ ] Caching headers

---

**Última actualización:** 2024

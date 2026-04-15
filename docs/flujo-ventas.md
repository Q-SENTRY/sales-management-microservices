# 📊 Flujo de Ventas - Sales Management Microservices

## 1. Resumen Ejecutivo

Este documento describe el flujo completo desde que un cliente accede al sistema hasta que completa una compra, incluyendo todos los microservicios involucrados, eventos disparados y datos procesados.

---

## 2. Flujo General de Compra (Happy Path)

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: AUTENTICACIÓN                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente abre la aplicación en navegador                │
│  2. Frontend redirige a login si no hay token              │
│  3. Cliente ingresa email y contraseña                     │
│  4. Frontend → POST /api/v1/auth/login (Usuarios Service) │
│  5. Usuarios Service verifica credenciales                │
│  6. Si OK → Genera JWT token                              │
│  7. Frontend guarda token en localStorage                 │
│  8. Cliente logueado y puede navegar                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 2: VER CATÁLOGO DE PRODUCTOS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente accede a página de productos                  │
│  2. Frontend → GET /api/v1/products (Productos Service)  │
│  3. Productos Service consulta MySQL                     │
│     SELECT * FROM productos                              │
│  4. Retorna lista con:                                    │
│     - id, nombre, descripción, precio, imagen            │
│  5. Frontend muestra grid de productos                   │
│  6. Cliente ve categorías y puede filtrar               │
│     Frontend → GET /api/v1/categories                    │
│  7. Cliente selecciona producto para más detalles       │
│     Frontend → GET /api/v1/products/:id                 │
│  8. Muestra detalles completos y stock disponible       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 3: AGREGAR AL CARRITO                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente hace clic en \"Agregar al Carrito\"            │
│  2. Frontend valida:                                        │
│     - Producto existe                                      │
│     - Cantidad válida                                      │
│     - Precio es correcto                                  │
│  3. Frontend almacena en localStorage:                     │
│     {                                                      │
│       cartItems: [                                        │
│         { productId: 1, nombre: \"Laptop\", precio: 1000,  │
│           quantity: 1, image: \"...\" }                    │
│       ]                                                    │
│     }                                                      │
│  4. Actualiza contador de carrito                         │
│  5. Si cliente agrega más productos, repite proceso      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 4: REVISAR CARRITO Y VALIDAR STOCK                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente accede a página de carrito                    │
│  2. Frontend obtiene carrito del localStorage              │
│  3. Valida stock actual en cada producto:                 │
│     FOR EACH item IN carrito:                             │
│       Frontend → GET /api/v1/inventory/:productId         │
│       (Inventario Service)                                │
│  4. Inventario Service consulta MySQL:                    │
│     SELECT cantidad FROM inventario                       │
│     WHERE producto_id = ?                                 │
│  5. Si cantidad < cantidad_solicitada:                   │
│     - Muestra error \"Cantidad no disponible\"            │
│     - Sugiere cantidad máxima disponible                  │
│  6. Si OK para todos los items:                          │
│     - Calcula total: Σ(precio * cantidad)                │
│     - Muestra resumen                                     │
│     - Cliente continúa a checkout                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 5: PROCESAR PAGO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente accede a página de checkout                   │
│  2. Ingresa información de envío:                          │
│     - Nombre, dirección, ciudad, código postal           │
│     - Teléfono                                            │
│  3. Selecciona método de pago:                            │
│     ☑ Tarjeta de crédito (Stripe/PayPal)                │
│     ☐ Transferencia bancaria                             │
│     ☐ Efectivo contra entrega                            │
│  4. Frontend valida datos con Joi:                        │
│     - Email válido                                        │
│     - Número de teléfono válido                          │
│     - Dirección completa                                 │
│     - Tarjeta válida (si aplica)                         │
│  5. Si hay error → Muestra validación y no continúa      │
│  6. Si OK → Procesa pago con Stripe API                  │
│     (ACTUAL: Simulado por ahora)                         │
│  7. Stripe retorna token de pago                          │
│  8. Frontend está listo para crear orden                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 6: CREAR ORDEN (Ventas Service)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Frontend → POST /api/v1/orders (Ventas Service)      │
│     Payload:                                              │
│     {                                                     │
│       usuario_id: 1,                                     │
│       items: [                                           │
│         { producto_id: 1, cantidad: 1, precio: 1000 }   │
│       ],                                                 │
│       total: 1000,                                       │
│       direccion_envio: \"Calle 123\",                     │
│       metodo_pago: \"tarjeta\",                          │
│       token_pago: \"stripe_token_123\"                   │
│     }                                                     │
│                                                             │
│  2. Ventas Service recibe y valida:                      │
│     - usuario_id existe y es válido                      │
│     - items no están vacíos                              │
│     - total es positivo                                  │
│                                                             │
│  3. Inserta en MySQL:                                     │
│     INSERT INTO ordenes (usuario_id, fecha, estado, total)│
│     VALUES (1, NOW(), 'pendiente', 1000)                 │
│     → Retorna orden_id = 123                             │
│                                                             │
│  4. Inserta items:                                        │
│     INSERT INTO orden_items (orden_id, producto_id, ...) │
│                                                             │
│  5. Publica evento a RabbitMQ:                           │
│     Event: 'orden.creada'                               │
│     {                                                     │
│       orden_id: 123,                                     │
│       usuario_id: 1,                                     │
│       items: [...],                                      │
│       timestamp: '2024-01-15T10:35:00Z'                  │
│     }                                                     │
│                                                             │
│  6. Retorna a Frontend:                                   │
│     {                                                     │
│       success: true,                                     │
│       orden_id: 123,                                     │
│       estado: 'pendiente'                                │
│     }                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 7: RESERVAR INVENTARIO                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Inventario Service consume evento 'orden.creada'      │
│                                                             │
│  2. Para cada item de la orden:                          │
│     - Verifica stock actual                              │
│     - Crea reserva:                                       │
│       INSERT INTO reservas (orden_id, producto_id, qty)  │
│       VALUES (123, 1, 1)                                 │
│                                                             │
│  3. Actualiza inventario:                                 │
│     UPDATE inventario                                     │
│     SET cantidad = cantidad - 1                          │
│     WHERE producto_id = 1                                │
│                                                             │
│  4. Registra movimiento:                                  │
│     INSERT INTO movimientos_inventario                   │
│     (producto_id, tipo, cantidad, descripcion)           │
│     VALUES (1, 'reserva', 1, 'Orden #123')               │
│                                                             │
│  5. Publica evento: 'stock.actualizado'                 │
│     {                                                     │
│       producto_id: 1,                                    │
│       cantidad_anterior: 100,                            │
│       cantidad_nueva: 99,                                │
│       timestamp: '2024-01-15T10:35:05Z'                  │
│     }                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 8: CONFIRMAR PAGO                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. La orden empieza con estado 'pendiente'              │
│                                                             │
│  2. Sistema verifica pago (Stripe webhook):             │
│     - Webhook de Stripe → Endpoint de Ventas Service     │
│     - Verifica firma del webhook                         │
│     - Obtiene ID de transacción                          │
│                                                             │
│  3. Actualiza orden:                                      │
│     UPDATE ordenes                                        │
│     SET estado = 'pagada', referencia_pago = 'stripe_tx' │
│     WHERE id = 123                                        │
│                                                             │
│  4. Publica evento: 'orden.pagada'                      │
│     {                                                     │
│       orden_id: 123,                                     │
│       usuario_id: 1,                                     │
│       total: 1000,                                       │
│       timestamp: '2024-01-15T10:35:10Z'                  │
│     }                                                     │
│                                                             │
│  5. Notifica al Frontend (polling o WebSocket):          │
│     Frontend actualiza estado de orden a 'pagada'        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 9: GENERAR FACTURA                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Facturación Service consume: 'orden.pagada'         │
│                                                             │
│  2. Obtiene datos de la orden:                           │
│     SELECT * FROM ordenes WHERE id = 123                │
│                                                             │
│  3. Obtiene datos del usuario (llamada HTTP):           │
│     GET /api/v1/users/1 (Usuarios Service)             │
│                                                             │
│  4. Obtiene detalles de productos (llamada HTTP):       │
│     GET /api/v1/products/:id (Productos Service)       │
│                                                             │
│  5. Genera número de factura único:                       │
│     FA-2024-00001                                        │
│                                                             │
│  6. Crea factura en MySQL:                               │
│     INSERT INTO facturas                                 │
│     (orden_id, numero, fecha, total, estado)             │
│     VALUES (123, 'FA-2024-00001', NOW(), 1000, 'emitida')│
│                                                             │
│  7. Genera PDF con PDFKit:                               │
│     - Membrete de la empresa                             │
│     - Número y fecha de factura                          │
│     - Datos del cliente                                  │
│     - Items con cantidades y precios                    │
│     - Subtotal, IVA, total                              │
│     - Guarda en carpeta /invoices/123.pdf               │
│                                                             │
│  8. Publica evento: 'factura.generada'                  │
│     {                                                     │
│       factura_id: 1,                                     │
│       orden_id: 123,                                     │
│       numero: 'FA-2024-00001',                           │
│       usuario_id: 1,                                     │
│       email: 'cliente@example.com'                      │
│     }                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 10: ENVIAR NOTIFICACIONES                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Notificaciones Service consume: 'factura.generada'   │
│                                                             │
│  2. Prepara correo electrónico:                          │
│     ────────────────────────────────────────────         │
│     Para: cliente@example.com                            │
│     Asunto: Tu factura #FA-2024-00001                   │
│     ────────────────────────────────────────────         │
│     Estimado Cliente,                                    │
│                                                             │
│     Tu orden #123 ha sido confirmada.                   │
│     Factura: FA-2024-00001                              │
│     Total: $1,000.00                                     │
│     Fecha: 15 de enero de 2024                          │
│                                                             │
│     Adjunto: PDF de factura                             │
│     ────────────────────────────────────────────         │
│                                                             │
│  3. Envía email:                                         │
│     Usa Nodemailer con Gmail/SendGrid                   │
│     - Si OK → Log de éxito                              │
│     - Si error → Reintento con exponential backoff      │
│                                                             │
│  4. Registra notificación en MySQL:                      │
│     INSERT INTO notificaciones                          │
│     (tipo, destinatario, asunto, estado, fecha)          │
│     VALUES ('email', 'cliente@example.com',              │
│     'Tu factura...', 'enviada', NOW())                   │
│                                                             │
│  5. Publica evento: 'cliente.notificado'               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PASO 11: CONFIRMACIÓN AL CLIENTE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Frontend muestra página de confirmación:             │
│     ✅ Pago procesado exitosamente                       │
│     📦 Tu orden #123 ha sido creada                     │
│     📧 Se ha enviado un correo con tu factura           │
│                                                             │
│  2. Muestra botones:                                     │
│     - [Ver orden]     → GET /api/v1/orders/123          │
│     - [Descargar PDF] → GET /api/v1/invoices/1/pdf     │
│     - [Continuar comprando]                             │
│                                                             │
│  3. Cliente puede:                                       │
│     - Ver historial de órdenes                          │
│     - Descargar facturas                                │
│     - Rastrear envío                                    │
│     - Volver al catálogo                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Diagrama de Eventos (Event Flow)

```
TIEMPO → Secuencia de eventos

T+0s   Orden.Creada
       └─→ Ventas Service publica a RabbitMQ
           Event: {orden_id: 123, items: [...]}

T+0.1s Eventos consumidos por:
       ├─→ Inventario Service
       ├─→ Notificaciones Service  
       └─→ Analytics Service

T+0.5s Inventario Service
       └─→ Reserva stock
       └─→ Publica: Stock.Actualizado

T+2s   Pago confirmado (Webhook Stripe)
       └─→ Orden.Pagada
           Ventas Service publica

T+2.1s Eventos consumidos por:
       ├─→ Inventario Service (confirma reserva)
       ├─→ Facturación Service
       └─→ Notificaciones Service

T+3s   Facturación Service
       └─→ Genera factura PDF
       └─→ Publica: Factura.Generada

T+3.1s Notificaciones Service
       └─→ Envía email con factura

T+3.5s Email enviado a cliente
       └─→ Orden completada
```

---

## 4. Casos de Error y Manejo

### 4.1 Error: Stock Insuficiente

```
Cliente intenta crear orden con 10 unidades
Inventario solo tiene 5

┌─────────────────────────────────┐
│ Ventas Service                  │
│ Crea orden (estado: pendiente)   │
└────────┬────────────────────────┘
         │
         └─→ RabbitMQ: orden.creada
             │
             ▼
         ┌─────────────────────────────────┐
         │ Inventario Service              │
         │ Verifica: 10 > 5 ✗              │
         │ → No reservation posible         │
         └────────┬────────────────────────┘
                  │
                  └─→ Publica: orden.fallida
                      {
                        orden_id: 123,
                        error: 'stock_insuficiente',
                        producto_id: 1,
                        solicitado: 10,
                        disponible: 5
                      }

         ┌─────────────────────────────────┐
         │ Notificaciones Service          │
         │ Envía email a cliente           │
         │ "Producto sin stock disponible" │
         └─────────────────────────────────┘

Ventas Service cancela orden:
UPDATE ordenes SET estado = 'cancelada' WHERE id = 123
```

### 4.2 Error: Pago Rechazado

```
Stripe rechaza la transacción

┌──────────────────────────────┐
│ Stripe Webhook               │
│ payment.failed               │
└────────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Ventas Service           │
    │ Actualiza orden          │
    │ estado: 'pago_fallido'   │
    └────────┬─────────────────┘
             │
             └─→ Notificaciones Service
                 Envía email:
                 "Tu pago fue rechazado.
                  Puedes reintentar."

Cliente reintentar o cancela:
- Si reintenta → Nuevo intento de pago
- Si cancela → Libera inventario reservado
```

### 4.3 Error: RabbitMQ No Disponible

```
RabbitMQ cae durante operación

Ventas Service intenta publicar evento
→ Error de conexión
→ Implementar:
  1. Retry automático (3 intentos)
  2. Almacenar evento en cola local
  3. Reintentar cuando RabbitMQ vuelva
  4. Alertar a DevOps
```

---

## 5. Validaciones en Cada Paso

### Paso 1: Autenticación
- ✓ Email formato válido
- ✓ Password mínimo 8 caracteres
- ✓ Email existe en BD
- ✓ Password coincide

### Paso 2: Catálogo
- ✓ Producto existe
- ✓ Precio es positivo
- ✓ Descripción no vacía

### Paso 3: Carrito
- ✓ ProductoId válido
- ✓ Cantidad > 0
- ✓ Cantidad < 1000

### Paso 4: Stock
- ✓ Stock actual >= cantidad
- ✓ Producto no está descontinuado

### Paso 5: Pago
- ✓ Email válido
- ✓ Dirección completa
- ✓ Tarjeta válida
- ✓ Fondos disponibles (Stripe)

### Paso 6: Crear Orden
- ✓ usuario_id existe
- ✓ items array no vacío
- ✓ total calculado correctamente
- ✓ total > 0

### Paso 7: Reservar Inventario
- ✓ Stock >= cantidad_solicitada
- ✓ Producto no está descontinuado
- ✓ Reserva generada correctamente

### Paso 8: Confirmar Pago
- ✓ Webhooksignature válida
- ✓ Transacción corresponde a orden
- ✓ Monto coincide

### Paso 9: Generar Factura
- ✓ Orden existe y está pagada
- ✓ Número de factura único
- ✓ PDF generado correctamente

### Paso 10: Notificaciones
- ✓ Email válido
- ✓ Conexión SMTP activa
- ✓ Email entregado

---

## 6. Estados de Orden

```
[pendiente] → Orden creada, esperando pago
    ↓
[pagada] → Pago confirmado
    ↓
[preparando] → En almacén, preparando envío
    ↓
[enviada] → En tránsito
    ↓
[entregada] → Completada
    ↓
[cancelada] ← Puede ocurrir desde cualquier estado
```

---

## 7. Métricas Importantes

- **Tiempo de checkout:** < 2 minutos
- **Tasa de conversión:** Órdenes creadas / Carritos
- **Tasa de abandono:** Carritos sin completar
- **Tiempo promedio de entrega:** Días
- **% de pagos exitosos:** > 95%
- **% de devoluciones:** < 5%

---

**Última actualización:** 2024

-- ============================================
-- Sales Management Database Schema
-- MySQL 8.0+
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS sales_management_db;
USE sales_management_db;

-- ============================================
-- 1. USUARIOS TABLES
-- ============================================

-- Tabla de usuarios/clientes
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de roles
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de permisos
CREATE TABLE permisos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion VARCHAR(255),
  modulo VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación usuario-rol
CREATE TABLE usuario_roles (
  usuario_id INT NOT NULL,
  rol_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, rol_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_rol_id (rol_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación rol-permiso
CREATE TABLE rol_permisos (
  rol_id INT NOT NULL,
  permiso_id INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PRODUCTOS TABLES
-- ============================================

-- Tabla de categorías
CREATE TABLE categorias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  precio_costo DECIMAL(10, 2),
  categoria_id INT NOT NULL,
  sku VARCHAR(100) UNIQUE,
  imagen_url VARCHAR(500),
  activo BOOLEAN DEFAULT TRUE,
  descontinuado BOOLEAN DEFAULT FALSE,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  INDEX idx_nombre (nombre),
  INDEX idx_categoria_id (categoria_id),
  INDEX idx_sku (sku),
  INDEX idx_activo (activo),
  INDEX idx_precio (precio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. VENTAS TABLES
-- ============================================

-- Tabla de órdenes
CREATE TABLE ordenes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  numero_orden VARCHAR(50) UNIQUE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente', 'pagada', 'preparando', 'enviada', 'entregada', 'cancelada') DEFAULT 'pendiente',
  subtotal DECIMAL(10, 2),
  iva DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(255),
  direccion_envio TEXT,
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(20),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha),
  INDEX idx_numero_orden (numero_orden),
  FULLTEXT idx_notas (notas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de items de orden
CREATE TABLE orden_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orden_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  INDEX idx_orden_id (orden_id),
  INDEX idx_producto_id (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. INVENTARIO TABLES
-- ============================================

-- Tabla de inventario
CREATE TABLE inventario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producto_id INT UNIQUE NOT NULL,
  cantidad INT DEFAULT 0,
  cantidad_minima INT DEFAULT 10,
  cantidad_maxima INT DEFAULT 1000,
  ubicacion_almacen VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_producto_id (producto_id),
  INDEX idx_cantidad (cantidad),
  INDEX idx_cantidad_minima (cantidad_minima)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de movimientos de inventario
CREATE TABLE movimientos_inventario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producto_id INT NOT NULL,
  tipo ENUM('entrada', 'salida', 'reserva', 'ajuste', 'devolucion') NOT NULL,
  cantidad INT NOT NULL,
  descripcion VARCHAR(255),
  referencia_externa VARCHAR(100),
  usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_producto_id (producto_id),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha (created_at),
  INDEX idx_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reservas
CREATE TABLE reservas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orden_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  estado ENUM('activa', 'confirmada', 'cancelada') DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  INDEX idx_orden_id (orden_id),
  INDEX idx_producto_id (producto_id),
  INDEX idx_estado (estado),
  UNIQUE KEY unique_orden_producto (orden_id, producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. FACTURACIÓN TABLES
-- ============================================

-- Tabla de facturas
CREATE TABLE facturas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orden_id INT UNIQUE NOT NULL,
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento DATE,
  subtotal DECIMAL(10, 2),
  iva DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  estado ENUM('borrador', 'emitida', 'pagada', 'anulada') DEFAULT 'emitida',
  ruta_pdf VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE RESTRICT,
  INDEX idx_numero_factura (numero_factura),
  INDEX idx_estado (estado),
  INDEX idx_fecha_emision (fecha_emision),
  INDEX idx_orden_id (orden_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. NOTIFICACIONES TABLES
-- ============================================

-- Tabla de notificaciones
CREATE TABLE notificaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  tipo ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
  destinatario VARCHAR(255) NOT NULL,
  asunto VARCHAR(255),
  cuerpo TEXT,
  estado ENUM('pendiente', 'enviada', 'fallida', 'reintentando') DEFAULT 'pendiente',
  referencia_externa VARCHAR(100),
  intentos_fallidos INT DEFAULT 0,
  proximo_reintento TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_tipo (tipo),
  INDEX idx_estado (estado),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. LOGS Y AUDITORÍA
-- ============================================

-- Tabla de logs de auditoría
CREATE TABLE auditoria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  tabla_afectada VARCHAR(100),
  tipo_operacion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  registros_afectados INT,
  valores_antiguos JSON,
  valores_nuevos JSON,
  ip_origen VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_tabla_afectada (tabla_afectada),
  INDEX idx_tipo_operacion (tipo_operacion),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de logs de errores
CREATE TABLE logs_sistema (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nivel ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL') DEFAULT 'INFO',
  servicio VARCHAR(100),
  mensaje TEXT,
  stack_trace TEXT,
  contexto JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nivel (nivel),
  INDEX idx_servicio (servicio),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('vendedor', 'Personal de ventas'),
('cliente', 'Cliente de la tienda'),
('almacenista', 'Personal de almacén');

-- Insertar permisos por defecto
INSERT INTO permisos (nombre, descripcion, modulo) VALUES
('crear_usuarios', 'Crear nuevos usuarios', 'usuarios'),
('editar_usuarios', 'Editar datos de usuarios', 'usuarios'),
('eliminar_usuarios', 'Eliminar usuarios', 'usuarios'),
('crear_productos', 'Crear nuevos productos', 'productos'),
('editar_productos', 'Editar productos', 'productos'),
('eliminar_productos', 'Eliminar productos', 'productos'),
('ver_ordenes', 'Ver todas las órdenes', 'ventas'),
('crear_ordenes', 'Crear órdenes', 'ventas'),
('editar_ordenes', 'Editar órdenes', 'ventas'),
('ver_inventario', 'Ver inventario', 'inventario'),
('editar_inventario', 'Editar inventario', 'inventario'),
('ver_reportes', 'Ver reportes', 'reportes'),
('generar_facturas', 'Generar facturas', 'facturacion');

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica', 'Productos electrónicos y gadgets'),
('Ropa', 'Prendas de vestir'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipo deportivo'),
('Libros', 'Libros y publicaciones');

-- ============================================
-- VIEWS ÚTILES
-- ============================================

-- Vista: Órdenes con información del cliente
CREATE VIEW vista_ordenes_detalle AS
SELECT
  o.id,
  o.numero_orden,
  u.name AS cliente_nombre,
  u.email AS cliente_email,
  o.total,
  o.estado,
  o.fecha,
  COUNT(oi.id) AS cantidad_items,
  SUM(oi.cantidad) AS productos_totales
FROM ordenes o
JOIN usuarios u ON o.usuario_id = u.id
LEFT JOIN orden_items oi ON o.id = oi.orden_id
GROUP BY o.id;

-- Vista: Productos con stock
CREATE VIEW vista_productos_stock AS
SELECT
  p.id,
  p.nombre,
  p.precio,
  p.categoria_id,
  c.nombre AS categoria,
  COALESCE(i.cantidad, 0) AS stock_actual,
  i.cantidad_minima,
  CASE
    WHEN COALESCE(i.cantidad, 0) < i.cantidad_minima THEN 'BAJO'
    WHEN COALESCE(i.cantidad, 0) < i.cantidad_minima * 2 THEN 'MEDIO'
    ELSE 'NORMAL'
  END AS estado_stock
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN inventario i ON p.id = i.producto_id
WHERE p.activo = TRUE AND p.descontinuado = FALSE;

-- Vista: Ventas del mes actual
CREATE VIEW vista_ventas_mes_actual AS
SELECT
  DATE(o.fecha) AS fecha,
  COUNT(o.id) AS cantidad_ordenes,
  SUM(o.total) AS monto_total,
  AVG(o.total) AS promedio_orden
FROM ordenes o
WHERE MONTH(o.fecha) = MONTH(NOW())
  AND YEAR(o.fecha) = YEAR(NOW())
  AND o.estado IN ('pagada', 'entregada')
GROUP BY DATE(o.fecha)
ORDER BY fecha DESC;

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_ordenes_usuario_estado ON ordenes(usuario_id, estado);
CREATE INDEX idx_orden_items_orden_producto ON orden_items(orden_id, producto_id);
CREATE INDEX idx_inventario_producto_cantidad ON inventario(producto_id, cantidad);
CREATE INDEX idx_movimientos_producto_tipo_fecha ON movimientos_inventario(producto_id, tipo, created_at);
CREATE INDEX idx_notificaciones_usuario_estado ON notificaciones(usuario_id, estado);

-- ============================================
-- STORED PROCEDURES ÚTILES
-- ============================================

-- Procedure: Crear orden desde datos
DELIMITER //
CREATE PROCEDURE sp_crear_orden(
  IN p_usuario_id INT,
  IN p_total DECIMAL(10,2),
  IN p_metodo_pago VARCHAR(50),
  OUT p_orden_id INT
)
BEGIN
  DECLARE v_numero_orden VARCHAR(50);
  
  SET v_numero_orden = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(SUBSTRING(UUID(), 1, 8), 8, '0'));
  
  INSERT INTO ordenes (usuario_id, numero_orden, total, metodo_pago, estado)
  VALUES (p_usuario_id, v_numero_orden, p_total, p_metodo_pago, 'pendiente');
  
  SET p_orden_id = LAST_INSERT_ID();
END//
DELIMITER ;

-- Procedure: Actualizar estado de orden
DELIMITER //
CREATE PROCEDURE sp_actualizar_estado_orden(
  IN p_orden_id INT,
  IN p_nuevo_estado VARCHAR(50)
)
BEGIN
  UPDATE ordenes
  SET estado = p_nuevo_estado,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_orden_id;
END//
DELIMITER ;

-- ============================================
-- FIN DEL SCHEMA
-- ============================================

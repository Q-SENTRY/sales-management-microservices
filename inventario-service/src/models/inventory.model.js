const pool = require('../config/database');

class InventoryModel {
  async getAllInventory() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          i.id,
          i.producto_id,
          i.cantidad,
          i.cantidad_minima,
          i.cantidad_maxima,
          i.ubicacion_almacen,
          i.updated_at,
          p.nombre as producto_nombre,
          p.sku as producto_sku,
          p.precio,
          CASE
            WHEN i.cantidad <= i.cantidad_minima THEN 'bajo'
            WHEN i.cantidad > i.cantidad_maxima THEN 'exceso'
            ELSE 'normal'
          END as estado_stock
        FROM inventario i
        LEFT JOIN productos p ON i.producto_id = p.id
        WHERE p.activo = true
        ORDER BY i.cantidad ASC, p.nombre ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getInventoryByProductId(productoId) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          i.id,
          i.producto_id,
          i.cantidad,
          i.cantidad_minima,
          i.cantidad_maxima,
          i.ubicacion_almacen,
          i.updated_at,
          p.nombre as producto_nombre,
          p.sku as producto_sku,
          p.precio
        FROM inventario i
        LEFT JOIN productos p ON i.producto_id = p.id
        WHERE i.producto_id = ? AND p.activo = true
      `, [productoId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async updateInventory(productoId, cantidad, ubicacionAlmacen = null) {
    try {
      const [existing] = await pool.execute(`
        SELECT id FROM inventario WHERE producto_id = ?
      `, [productoId]);

      if (existing.length > 0) {
        // Actualizar inventario existente
        await pool.execute(`
          UPDATE inventario SET
            cantidad = ?,
            ubicacion_almacen = COALESCE(?, ubicacion_almacen),
            updated_at = CURRENT_TIMESTAMP
          WHERE producto_id = ?
        `, [cantidad, ubicacionAlmacen, productoId]);
      } else {
        // Crear nuevo registro de inventario
        await pool.execute(`
          INSERT INTO inventario (producto_id, cantidad, ubicacion_almacen)
          VALUES (?, ?, ?)
        `, [productoId, cantidad, ubicacionAlmacen]);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  async addInventoryMovement(productoId, tipo, cantidad, descripcion = null, referenciaExterna = null, usuarioId = null) {
    try {
      await pool.execute(`
        INSERT INTO movimientos_inventario (
          producto_id, tipo, cantidad, descripcion, referencia_externa, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [productoId, tipo, cantidad, descripcion, referenciaExterna, usuarioId]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  async getLowStockProducts() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          i.producto_id,
          p.nombre as producto_nombre,
          p.sku,
          i.cantidad,
          i.cantidad_minima,
          (i.cantidad_minima - i.cantidad) as cantidad_faltante
        FROM inventario i
        LEFT JOIN productos p ON i.producto_id = p.id
        WHERE i.cantidad <= i.cantidad_minima AND p.activo = true
        ORDER BY i.cantidad ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getInventoryMovements(productoId = null, limit = 50) {
    try {
      let query = `
        SELECT
          mi.id,
          mi.producto_id,
          mi.tipo,
          mi.cantidad,
          mi.descripcion,
          mi.referencia_externa,
          mi.usuario_id,
          mi.created_at,
          p.nombre as producto_nombre,
          p.sku,
          u.name as usuario_nombre
        FROM movimientos_inventario mi
        LEFT JOIN productos p ON mi.producto_id = p.id
        LEFT JOIN usuarios u ON mi.usuario_id = u.id
      `;
      let params = [];

      if (productoId) {
        query += ' WHERE mi.producto_id = ?';
        params.push(productoId);
      }

      query += ' ORDER BY mi.created_at DESC LIMIT ?';
      params.push(limit);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryModel();

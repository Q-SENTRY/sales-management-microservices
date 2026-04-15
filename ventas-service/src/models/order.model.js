const pool = require('../config/database');

class OrderModel {
  async getAllOrders() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          o.id,
          o.numero_orden,
          o.fecha,
          o.estado,
          o.subtotal,
          o.iva,
          o.total,
          o.metodo_pago,
          o.referencia_pago,
          o.direccion_envio,
          o.ciudad,
          o.codigo_postal,
          o.notas,
          o.created_at,
          o.updated_at,
          u.name as usuario_nombre,
          u.email as usuario_email
        FROM ordenes o
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        ORDER BY o.created_at DESC
      `);

      // Obtener items para cada orden
      for (let order of rows) {
        const [items] = await pool.execute(`
          SELECT
            oi.id,
            oi.cantidad,
            oi.precio_unitario,
            oi.subtotal,
            p.nombre as producto_nombre,
            p.sku as producto_sku
          FROM orden_items oi
          LEFT JOIN productos p ON oi.producto_id = p.id
          WHERE oi.orden_id = ?
        `, [order.id]);
        order.items = items;
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          o.id,
          o.numero_orden,
          o.fecha,
          o.estado,
          o.subtotal,
          o.iva,
          o.total,
          o.metodo_pago,
          o.referencia_pago,
          o.direccion_envio,
          o.ciudad,
          o.codigo_postal,
          o.notas,
          o.created_at,
          o.updated_at,
          u.name as usuario_nombre,
          u.email as usuario_email
        FROM ordenes o
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        WHERE o.id = ?
      `, [id]);

      if (rows.length === 0) return null;

      const order = rows[0];

      // Obtener items de la orden
      const [items] = await pool.execute(`
        SELECT
          oi.id,
          oi.cantidad,
          oi.precio_unitario,
          oi.subtotal,
          p.nombre as producto_nombre,
          p.sku as producto_sku
        FROM orden_items oi
        LEFT JOIN productos p ON oi.producto_id = p.id
        WHERE oi.orden_id = ?
      `, [id]);

      order.items = items;
      return order;
    } catch (error) {
      throw error;
    }
  }

  async createOrder(orderData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        usuario_id,
        numero_orden,
        items,
        metodo_pago,
        referencia_pago,
        direccion_envio,
        ciudad,
        codigo_postal,
        notas
      } = orderData;

      // Calcular totales
      let subtotal = 0;
      for (let item of items) {
        subtotal += item.cantidad * item.precio_unitario;
      }
      const iva = subtotal * 0.19; // IVA 19%
      const total = subtotal + iva;

      // Insertar orden
      const [orderResult] = await connection.execute(`
        INSERT INTO ordenes (
          usuario_id, numero_orden, subtotal, iva, total,
          metodo_pago, referencia_pago, direccion_envio,
          ciudad, codigo_postal, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        usuario_id, numero_orden, subtotal, iva, total,
        metodo_pago, referencia_pago, direccion_envio,
        ciudad, codigo_postal, notas
      ]);

      const orderId = orderResult.insertId;

      // Insertar items
      for (let item of items) {
        await connection.execute(`
          INSERT INTO orden_items (
            orden_id, producto_id, cantidad, precio_unitario, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          orderId, item.producto_id, item.cantidad,
          item.precio_unitario, item.cantidad * item.precio_unitario
        ]);
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateOrderStatus(id, estado) {
    try {
      await pool.execute(`
        UPDATE ordenes SET
          estado = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [estado, id]);

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderModel();

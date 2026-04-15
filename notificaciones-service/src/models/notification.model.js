const pool = require('../config/database');

class NotificationModel {
  async getAllNotifications() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          n.id,
          n.usuario_id,
          n.tipo,
          n.destinatario,
          n.asunto,
          n.cuerpo,
          n.estado,
          n.referencia_externa,
          n.intentos_fallidos,
          n.proximo_reintento,
          n.created_at,
          n.sent_at,
          u.name as usuario_nombre,
          u.email as usuario_email
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        ORDER BY n.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          n.id,
          n.usuario_id,
          n.tipo,
          n.destinatario,
          n.asunto,
          n.cuerpo,
          n.estado,
          n.referencia_externa,
          n.intentos_fallidos,
          n.proximo_reintento,
          n.created_at,
          n.sent_at,
          u.name as usuario_nombre,
          u.email as usuario_email
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        WHERE n.id = ?
      `, [id]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getNotificationsByUser(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          n.id,
          n.usuario_id,
          n.tipo,
          n.destinatario,
          n.asunto,
          n.cuerpo,
          n.estado,
          n.referencia_externa,
          n.intentos_fallidos,
          n.proximo_reintento,
          n.created_at,
          n.updated_at
        FROM notificaciones n
        WHERE n.usuario_id = ?
        ORDER BY n.created_at DESC
      `, [userId]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      const {
        usuario_id,
        tipo,
        destinatario,
        asunto,
        cuerpo,
        referencia_externa
      } = notificationData;

      const [result] = await pool.execute(`
        INSERT INTO notificaciones (
          usuario_id, tipo, destinatario, asunto, cuerpo, referencia_externa
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        usuario_id, tipo, destinatario, asunto, cuerpo, referencia_externa
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async updateNotificationStatus(id, estado, intentosFallidos = null, proximoReintento = null) {
    try {
      let query = `UPDATE notificaciones SET estado = ?, updated_at = CURRENT_TIMESTAMP`;
      let params = [estado];

      if (intentosFallidos !== null) {
        query += `, intentos_fallidos = ?`;
        params.push(intentosFallidos);
      }

      if (proximoReintento !== null) {
        query += `, proximo_reintento = ?`;
        params.push(proximoReintento);
      }

      query += ` WHERE id = ?`;
      params.push(id);

      await pool.execute(query, params);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getPendingNotifications() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          n.id,
          n.usuario_id,
          n.tipo,
          n.destinatario,
          n.asunto,
          n.cuerpo,
          n.estado,
          n.referencia_externa,
          n.intentos_fallidos,
          n.proximo_reintento,
          n.created_at,
          u.name as usuario_nombre,
          u.email as usuario_email
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        WHERE n.estado IN ('pendiente', 'reintentando')
        AND (n.proximo_reintento IS NULL OR n.proximo_reintento <= NOW())
        ORDER BY n.created_at ASC
        LIMIT 50
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async createOrderConfirmationNotification(orderId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Obtener datos de la orden
      const [orderRows] = await connection.execute(`
        SELECT
          o.id,
          o.numero_orden,
          o.total,
          o.usuario_id,
          u.name as cliente_nombre,
          u.email as cliente_email
        FROM ordenes o
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (orderRows.length === 0) {
        throw new Error('Orden no encontrada');
      }

      const order = orderRows[0];

      // Crear notificación de confirmación
      const asunto = `Confirmación de Orden ${order.numero_orden}`;
      const cuerpo = `
        Hola ${order.cliente_nombre},

        Tu orden ${order.numero_orden} ha sido confirmada exitosamente.

        Total: $${order.total}

        Gracias por tu compra.

        Saludos,
        Equipo de Ventas
      `.trim();

      const [result] = await connection.execute(`
        INSERT INTO notificaciones (
          usuario_id, tipo, destinatario, asunto, cuerpo, referencia_externa
        ) VALUES (?, 'email', ?, ?, ?, ?)
      `, [
        order.usuario_id, order.cliente_email, asunto, cuerpo, `order_${orderId}`
      ]);

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new NotificationModel();

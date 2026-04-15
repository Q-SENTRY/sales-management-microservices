const pool = require('../config/database');

class InvoiceModel {
  async getAllInvoices() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          f.id,
          f.orden_id,
          f.numero_factura,
          f.fecha_emision,
          f.fecha_vencimiento,
          f.subtotal,
          f.iva,
          f.total,
          f.estado,
          f.ruta_pdf,
          f.notas,
          f.created_at,
          f.updated_at,
          o.numero_orden,
          u.name as cliente_nombre,
          u.email as cliente_email
        FROM facturas f
        LEFT JOIN ordenes o ON f.orden_id = o.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        ORDER BY f.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          f.id,
          f.orden_id,
          f.numero_factura,
          f.fecha_emision,
          f.fecha_vencimiento,
          f.subtotal,
          f.iva,
          f.total,
          f.estado,
          f.ruta_pdf,
          f.notas,
          f.created_at,
          f.updated_at,
          o.numero_orden,
          u.name as cliente_nombre,
          u.email as cliente_email
        FROM facturas f
        LEFT JOIN ordenes o ON f.orden_id = o.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        WHERE f.id = ?
      `, [id]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceByOrderId(orderId) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          f.id,
          f.orden_id,
          f.numero_factura,
          f.fecha_emision,
          f.fecha_vencimiento,
          f.subtotal,
          f.iva,
          f.total,
          f.estado,
          f.ruta_pdf,
          f.notas,
          f.created_at,
          f.updated_at
        FROM facturas f
        WHERE f.orden_id = ?
      `, [orderId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async createInvoice(invoiceData) {
    try {
      const {
        orden_id,
        numero_factura,
        fecha_vencimiento,
        subtotal,
        iva,
        total,
        ruta_pdf,
        notas
      } = invoiceData;

      const [result] = await pool.execute(`
        INSERT INTO facturas (
          orden_id, numero_factura, fecha_vencimiento,
          subtotal, iva, total, ruta_pdf, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orden_id, numero_factura, fecha_vencimiento,
        subtotal, iva, total, ruta_pdf, notas
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async updateInvoiceStatus(id, estado) {
    try {
      await pool.execute(`
        UPDATE facturas SET
          estado = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [estado, id]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  async generateInvoiceFromOrder(orderId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Obtener datos de la orden
      const [orderRows] = await connection.execute(`
        SELECT
          o.id,
          o.numero_orden,
          o.subtotal,
          o.iva,
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

      // Generar número de factura
      const [countRows] = await connection.execute(`
        SELECT COUNT(*) as total FROM facturas WHERE YEAR(created_at) = YEAR(CURDATE())
      `);
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(countRows[0].total + 1).padStart(4, '0')}`;

      // Calcular fecha de vencimiento (30 días)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Crear factura
      const [result] = await connection.execute(`
        INSERT INTO facturas (
          orden_id, numero_factura, fecha_vencimiento,
          subtotal, iva, total
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        orderId, invoiceNumber, dueDate.toISOString().split('T')[0],
        order.subtotal, order.iva, order.total
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

module.exports = new InvoiceModel();

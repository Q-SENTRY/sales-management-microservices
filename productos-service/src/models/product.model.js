const pool = require('../config/database');

class ProductModel {
  async getAllProducts() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          p.id,
          p.nombre,
          p.descripcion,
          p.precio,
          p.precio_costo,
          p.categoria_id,
          c.nombre as categoria_nombre,
          p.sku,
          p.imagen_url,
          p.activo,
          p.descontinuado,
          p.marca,
          p.modelo,
          p.created_at,
          p.updated_at
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = true
        ORDER BY p.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          p.id,
          p.nombre,
          p.descripcion,
          p.precio,
          p.precio_costo,
          p.categoria_id,
          c.nombre as categoria_nombre,
          p.sku,
          p.imagen_url,
          p.activo,
          p.descontinuado,
          p.marca,
          p.modelo,
          p.created_at,
          p.updated_at
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id = ? AND p.activo = true
      `, [id]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        precio_costo,
        categoria_id,
        sku,
        imagen_url,
        marca,
        modelo
      } = productData;

      const [result] = await pool.execute(`
        INSERT INTO productos (
          nombre, descripcion, precio, precio_costo,
          categoria_id, sku, imagen_url, marca, modelo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nombre, descripcion, precio, precio_costo,
        categoria_id, sku, imagen_url, marca, modelo
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        precio_costo,
        categoria_id,
        sku,
        imagen_url,
        marca,
        modelo,
        activo
      } = productData;

      await pool.execute(`
        UPDATE productos SET
          nombre = ?, descripcion = ?, precio = ?,
          precio_costo = ?, categoria_id = ?, sku = ?,
          imagen_url = ?, marca = ?, modelo = ?,
          activo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        nombre, descripcion, precio, precio_costo,
        categoria_id, sku, imagen_url, marca, modelo,
        activo, id
      ]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      // Soft delete - marcar como inactivo
      await pool.execute(`
        UPDATE productos SET
          activo = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductModel();

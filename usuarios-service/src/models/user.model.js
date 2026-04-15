/**
 * User Model
 * Acceso a datos de usuarios
 */

const db = require('../config/database');
const logger = require('../config/logger');

class UserModel {
  async getAllUsers() {
    try {
      const query = 'SELECT id, email, name, created_at FROM usuarios LIMIT 100';
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      logger.error(`Error en getAllUsers: ${error.message}`);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const query = 'SELECT id, email, name, created_at FROM usuarios WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`Error en getUserById: ${error.message}`);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const query = 'SELECT * FROM usuarios WHERE email = ?';
      const [rows] = await db.execute(query, [email]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`Error en getUserByEmail: ${error.message}`);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const { email, password, name } = userData;
      const query = 'INSERT INTO usuarios (email, password, name) VALUES (?, ?, ?)';
      const [result] = await db.execute(query, [email, password, name]);
      
      return {
        id: result.insertId,
        email,
        name
      };
    } catch (error) {
      logger.error(`Error en createUser: ${error.message}`);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      const allowedFields = ['name', 'email'];
      const setClause = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClause.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (setClause.length === 0) return this.getUserById(id);

      values.push(id);
      const query = `UPDATE usuarios SET ${setClause.join(', ')} WHERE id = ?`;
      await db.execute(query, values);

      return this.getUserById(id);
    } catch (error) {
      logger.error(`Error en updateUser: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const query = 'DELETE FROM usuarios WHERE id = ?';
      await db.execute(query, [id]);
      return { success: true };
    } catch (error) {
      logger.error(`Error en deleteUser: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserModel();

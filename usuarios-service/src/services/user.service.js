/**
 * User Service
 * Lógica de negocio de usuarios
 */

const userModel = require('../models/user.model');
const logger = require('../config/logger');

class UserService {
  async getAllUsers() {
    try {
      return await userModel.getAllUsers();
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      return await userModel.getUserById(id);
    } catch (error) {
      logger.error(`Error al obtener usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      return await userModel.updateUser(id, updates);
    } catch (error) {
      logger.error(`Error al actualizar usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      return await userModel.deleteUser(id);
    } catch (error) {
      logger.error(`Error al eliminar usuario ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserService();

/**
 * User Controller
 * Lógica de gestión de usuarios
 */

const userService = require('../services/user.service');
const logger = require('../config/logger');

class UserController {
  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Error al obtener usuario: ${error.message}`);
      next(error);
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await userService.updateUser(id, updates);
      
      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user
      });
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error.message}`);
      next(error);
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar usuario: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new UserController();

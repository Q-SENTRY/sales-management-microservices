/**
 * Auth Controller
 * Lógica de autenticación
 */

const authService = require('../services/auth.service');
const logger = require('../config/logger');

class AuthController {
  /**
   * Registrar nuevo usuario
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      
      // Validación básica
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Email, password y name son requeridos'
        });
      }

      const user = await authService.register({ email, password, name });
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: user
      });
    } catch (error) {
      logger.error(`Error en registro: ${error.message}`);
      next(error);
    }
  }

  /**
   * Login de usuario
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y password son requeridos'
        });
      }

      const { user, token } = await authService.login({ email, password });
      
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      logger.error(`Error en login: ${error.message}`);
      next(error);
    }
  }

  /**
   * Renovar token
   */
  async refreshToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Token es requerido'
        });
      }

      const newToken = await authService.refreshToken(token);
      
      res.status(200).json({
        success: true,
        message: 'Token renovado exitosamente',
        data: { token: newToken }
      });
    } catch (error) {
      logger.error(`Error en refresh token: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new AuthController();

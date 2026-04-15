/**
 * Auth Service
 * Lógica de negocio de autenticación
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const config = require('../config/config');
const logger = require('../config/logger');

class AuthService {
  async register(userData) {
    try {
      // Verificar si usuario existe
      const existingUser = await userModel.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Hash de password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Crear usuario
      const user = await userModel.createUser({
        ...userData,
        password: hashedPassword
      });

      // Remover password de respuesta
      delete user.password;
      
      return user;
    } catch (error) {
      logger.error(`Error en registro: ${error.message}`);
      throw error;
    }
  }

  async login(credentials) {
    try {
      // Buscar usuario
      const user = await userModel.getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Usuario o contraseña inválida');
      }

      // Verificar password
      const validPassword = await bcrypt.compare(credentials.password, user.password);
      if (!validPassword) {
        throw new Error('Usuario o contraseña inválida');
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      delete user.password;
      
      return { user, token };
    } catch (error) {
      logger.error(`Error en login: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return newToken;
    } catch (error) {
      logger.error(`Error al renovar token: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AuthService();

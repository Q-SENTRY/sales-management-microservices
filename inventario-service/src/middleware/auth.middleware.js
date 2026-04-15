/**
 * JWT Authentication Middleware
 * Verifica tokens JWT en las rutas protegidas
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../config/logger');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido'
      });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        logger.warn(`Token inválido: ${err.message}`);
        return res.status(403).json({
          error: 'Token inválido o expirado'
        });
      }

      req.user = user; // Guardar información del usuario en la request
      next();
    });
  } catch (error) {
    logger.error(`Error en middleware de autenticación: ${error.message}`);
    next(error);
  }
};

module.exports = {
  authenticateToken
};
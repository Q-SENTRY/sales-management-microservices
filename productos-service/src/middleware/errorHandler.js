const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.path}`
  });
};

module.exports = { errorHandler, notFoundHandler };

/**
 * Usuarios Service - Entry Point
 * Gestión de usuarios y autenticación
 */

const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

const PORT = config.port;

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`✅ Usuarios Service escuchando en puerto ${PORT}`);
  logger.info(`Environment: ${config.environment}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando gracefully...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = server;

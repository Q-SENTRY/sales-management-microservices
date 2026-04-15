const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`✅ Productos Service escuchando en puerto ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('Cerrando servidor...');
  server.close(() => process.exit(0));
});

module.exports = server;

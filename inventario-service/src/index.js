const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

const server = app.listen(config.port, () => {
  logger.info(`✅ Inventario Service en puerto ${config.port}`);
});

process.on('SIGTERM', () => server.close());

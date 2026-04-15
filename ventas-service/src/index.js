const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`✅ Ventas Service escuchando en puerto ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

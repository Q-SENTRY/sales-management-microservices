/**
 * Database Configuration
 * Conexión a MySQL
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// Test connection
pool.getConnection()
  .then(connection => {
    logger.info('✅ Conexión a MySQL exitosa');
    connection.release();
  })
  .catch(err => {
    logger.error('❌ Error al conectar a MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  connectionLimit: 10,
});

pool.getConnection().then(() => {
  logger.info('✅ MySQL conectado');
}).catch(err => {
  logger.error('Error MySQL: ' + err.message);
  process.exit(1);
});

module.exports = pool;

require('dotenv').config();

module.exports = {
  port: process.env.SERVICE_PORT || 3002,
  environment: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    name: process.env.DB_NAME || 'sales_management_db',
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT) || 10,
  },
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' },
  logging: { level: process.env.LOG_LEVEL || 'info' },
};

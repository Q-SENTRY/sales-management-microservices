/**
 * General Configuration
 * Variables de entorno y configuraciones
 */

require('dotenv').config();

module.exports = {
  // Aplicación
  port: process.env.SERVICE_PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    name: process.env.DB_NAME || 'sales_management_db',
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT) || 10,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'session_secret',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

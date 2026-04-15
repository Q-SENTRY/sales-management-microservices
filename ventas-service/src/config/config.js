require('dotenv').config();
module.exports = {
  port: process.env.SERVICE_PORT || 3003,
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    name: process.env.DB_NAME || 'sales_management_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' },
  rabbitmq: { host: process.env.RABBITMQ_HOST || 'localhost' },
};

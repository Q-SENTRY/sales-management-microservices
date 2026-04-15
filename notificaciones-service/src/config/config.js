require('dotenv').config();
module.exports = {
  port: process.env.SERVICE_PORT || 3006,
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' },
  rabbitmq: { host: process.env.RABBITMQ_HOST || 'localhost' },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
  },
};

/**
 * Express App Configuration
 * Setup de middleware y rutas
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const logger = require('./config/logger');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// ============================================
// MIDDLEWARE DE PARSEO
// ============================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ============================================
// RUTAS DE SALUD
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'usuarios-service' });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready', service: 'usuarios-service' });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// ============================================
// RUTAS NO ENCONTRADAS
// ============================================
app.use(notFoundHandler);

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const notificationRoutes = require('./routes/notification.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notificaciones-service' }));
app.use('/api/v1/notifications', notificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;

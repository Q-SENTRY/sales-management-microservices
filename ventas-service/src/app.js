const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const logger = require('./config/logger');
const orderRoutes = require('./routes/order.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ventas-service' }));
app.use('/api/v1/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;

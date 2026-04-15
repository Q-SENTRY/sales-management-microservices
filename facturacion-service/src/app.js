const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const invoiceRoutes = require('./routes/invoice.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'facturacion-service' }));
app.use('/api/v1/invoices', invoiceRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;

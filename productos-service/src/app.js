const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const logger = require('./config/logger');
const productRoutes = require('./routes/product.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'productos-service' });
});

app.use('/api/v1/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

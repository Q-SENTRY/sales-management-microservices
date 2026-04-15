const logger = require('../config/logger');
const errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: err.message });
};
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'No encontrado' });
};
module.exports = { errorHandler, notFoundHandler };

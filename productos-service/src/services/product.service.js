const logger = require('../config/logger');

class ProductService {
  async getAllProducts() {
    try {
      logger.info('Obteniendo todos los productos');
      return [];
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ProductService();

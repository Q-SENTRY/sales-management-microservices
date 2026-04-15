const logger = require('../config/logger');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'Endpoint GET productos implementado',
        data: []
      });
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Endpoint GET producto ${id}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      res.status(201).json({
        success: true,
        message: 'Endpoint POST productos implementado'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Endpoint PUT producto ${id}`
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Endpoint DELETE producto ${id}`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();

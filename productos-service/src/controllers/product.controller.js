const logger = require('../config/logger');
const productModel = require('../models/product.model');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const products = await productModel.getAllProducts();
      res.status(200).json({
        success: true,
        message: 'Productos obtenidos exitosamente',
        data: products,
        count: products.length
      });
    } catch (error) {
      logger.error(`Error al obtener productos: ${error.message}`);
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productModel.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Producto obtenido exitosamente',
        data: product
      });
    } catch (error) {
      logger.error(`Error al obtener producto ${req.params.id}: ${error.message}`);
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const productId = await productModel.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: { id: productId }
      });
    } catch (error) {
      logger.error(`Error al crear producto: ${error.message}`);
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productModel.updateProduct(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar producto ${id}: ${error.message}`);
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productModel.deleteProduct(id);
      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar producto ${id}: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new ProductController();

const logger = require('../config/logger');
const inventoryModel = require('../models/inventory.model');

class InventoryController {
  async getInventory(req, res, next) {
    try {
      const inventory = await inventoryModel.getAllInventory();
      res.status(200).json({
        success: true,
        message: 'Inventario obtenido exitosamente',
        data: inventory,
        count: inventory.length
      });
    } catch (error) {
      logger.error(`Error al obtener inventario: ${error.message}`);
      next(error);
    }
  }

  async getProductStock(req, res, next) {
    try {
      const { productId } = req.params;
      const stock = await inventoryModel.getInventoryByProductId(productId);

      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado en inventario'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Stock del producto obtenido exitosamente',
        data: stock
      });
    } catch (error) {
      logger.error(`Error al obtener stock del producto ${req.params.productId}: ${error.message}`);
      next(error);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { productId } = req.params;
      const { cantidad, ubicacion_almacen } = req.body;

      await inventoryModel.updateInventory(productId, cantidad, ubicacion_almacen);
      res.status(200).json({
        success: true,
        message: 'Stock actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar stock: ${error.message}`);
      next(error);
    }
  }

  async getLowStockProducts(req, res, next) {
    try {
      const lowStockProducts = await inventoryModel.getLowStockProducts();
      res.status(200).json({
        success: true,
        message: 'Productos con stock bajo obtenidos exitosamente',
        data: lowStockProducts,
        count: lowStockProducts.length
      });
    } catch (error) {
      logger.error(`Error al obtener productos con stock bajo: ${error.message}`);
      next(error);
    }
  }

  async getInventoryMovements(req, res, next) {
    try {
      const { productId } = req.params;
      const { limit } = req.query;
      const movements = await inventoryModel.getInventoryMovements(productId, limit || 50);
      res.status(200).json({
        success: true,
        message: 'Movimientos de inventario obtenidos exitosamente',
        data: movements,
        count: movements.length
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos de inventario: ${error.message}`);
      next(error);
    }
  }

  async addInventoryMovement(req, res, next) {
    try {
      const { productId } = req.params;
      const { tipo, cantidad, descripcion, referencia_externa, usuario_id } = req.body;

      await inventoryModel.addInventoryMovement(
        productId, tipo, cantidad, descripcion, referencia_externa, usuario_id
      );
      res.status(201).json({
        success: true,
        message: 'Movimiento de inventario registrado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al registrar movimiento de inventario: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new InventoryController();

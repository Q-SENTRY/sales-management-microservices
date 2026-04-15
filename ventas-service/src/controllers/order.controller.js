const logger = require('../config/logger');
const orderModel = require('../models/order.model');

class OrderController {
  async getAllOrders(req, res, next) {
    try {
      const orders = await orderModel.getAllOrders();
      res.status(200).json({
        success: true,
        message: 'Órdenes obtenidas exitosamente',
        data: orders,
        count: orders.length
      });
    } catch (error) {
      logger.error(`Error al obtener órdenes: ${error.message}`);
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderModel.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Orden obtenida exitosamente',
        data: order
      });
    } catch (error) {
      logger.error(`Error al obtener orden ${req.params.id}: ${error.message}`);
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const orderId = await orderModel.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: { id: orderId }
      });
    } catch (error) {
      logger.error(`Error al crear orden: ${error.message}`);
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      await orderModel.updateOrderStatus(id, estado);
      res.status(200).json({
        success: true,
        message: 'Estado de orden actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar orden ${id}: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new OrderController();

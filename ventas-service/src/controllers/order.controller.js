const logger = require('../config/logger');

class OrderController {
  async getAllOrders(req, res) {
    try {
      res.json({ success: true, message: 'GET órdenes', data: [] });
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ error: error.message });
    }
  }
  async getOrderById(req, res) {
    res.json({ success: true, message: 'GET orden ' + req.params.id });
  }
  async createOrder(req, res) {
    res.status(201).json({ success: true, message: 'Orden creada' });
  }
}

module.exports = new OrderController();

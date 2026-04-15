const logger = require('../config/logger');
const notificationModel = require('../models/notification.model');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationModel.getAllNotifications();
      res.status(200).json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      logger.error(`Error al obtener notificaciones: ${error.message}`);
      next(error);
    }
  }

  async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationModel.getNotificationById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notificación obtenida exitosamente',
        data: notification
      });
    } catch (error) {
      logger.error(`Error al obtener notificación ${req.params.id}: ${error.message}`);
      next(error);
    }
  }

  async getNotificationsByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const notifications = await notificationModel.getNotificationsByUser(userId);
      res.status(200).json({
        success: true,
        message: 'Notificaciones del usuario obtenidas exitosamente',
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      logger.error(`Error al obtener notificaciones del usuario ${req.params.userId}: ${error.message}`);
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const notificationId = await notificationModel.createNotification(req.body);
      res.status(201).json({
        success: true,
        message: 'Notificación creada exitosamente',
        data: { id: notificationId }
      });
    } catch (error) {
      logger.error(`Error al crear notificación: ${error.message}`);
      next(error);
    }
  }

  async sendOrderConfirmation(req, res, next) {
    try {
      const { orderId } = req.params;
      const notificationId = await notificationModel.createOrderConfirmationNotification(orderId);
      res.status(201).json({
        success: true,
        message: 'Notificación de confirmación de orden enviada exitosamente',
        data: { id: notificationId }
      });
    } catch (error) {
      logger.error(`Error al enviar notificación de orden ${req.params.orderId}: ${error.message}`);
      next(error);
    }
  }

  async updateNotificationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, intentos_fallidos, proximo_reintento } = req.body;
      await notificationModel.updateNotificationStatus(id, estado, intentos_fallidos, proximo_reintento);
      res.status(200).json({
        success: true,
        message: 'Estado de notificación actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar notificación ${id}: ${error.message}`);
      next(error);
    }
  }

  async getPendingNotifications(req, res, next) {
    try {
      const notifications = await notificationModel.getPendingNotifications();
      res.status(200).json({
        success: true,
        message: 'Notificaciones pendientes obtenidas exitosamente',
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      logger.error(`Error al obtener notificaciones pendientes: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new NotificationController();

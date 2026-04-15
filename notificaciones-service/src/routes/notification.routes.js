const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.get('/pending', notificationController.getPendingNotifications);
router.get('/:id', notificationController.getNotificationById);
router.get('/user/:userId', notificationController.getNotificationsByUser);
router.post('/', notificationController.createNotification);
router.post('/order-confirmation/:orderId', notificationController.sendOrderConfirmation);
router.put('/:id/status', notificationController.updateNotificationStatus);

module.exports = router;

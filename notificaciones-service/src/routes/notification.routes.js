const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

router.post('/email', notificationController.sendEmail);
router.post('/sms', notificationController.sendSMS);
router.get('/logs', notificationController.getLogs);

module.exports = router;

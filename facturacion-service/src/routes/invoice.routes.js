const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/order/:orderId', invoiceController.getInvoiceByOrderId);
router.post('/', invoiceController.createInvoice);
router.post('/generate/:orderId', invoiceController.generateInvoiceFromOrder);
router.put('/:id/status', invoiceController.updateInvoiceStatus);

module.exports = router;

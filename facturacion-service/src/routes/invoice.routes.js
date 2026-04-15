const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

router.get('/', invoiceController.getInvoices);
router.post('/', invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/pdf', invoiceController.downloadPDF);

module.exports = router;

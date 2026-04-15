const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

router.get('/', inventoryController.getInventory);
router.get('/:productId', inventoryController.getProductStock);
router.post('/reserve', inventoryController.reserveStock);
router.post('/adjust', inventoryController.adjustStock);

module.exports = router;

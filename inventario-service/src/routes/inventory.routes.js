const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStockProducts);
router.get('/:productId', inventoryController.getProductStock);
router.get('/:productId/movements', inventoryController.getInventoryMovements);
router.put('/:productId', inventoryController.updateStock);
router.post('/:productId/movements', inventoryController.addInventoryMovement);

module.exports = router;

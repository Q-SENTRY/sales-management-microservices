/**
 * User Routes
 * Endpoints de usuarios
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

// @GET /api/v1/users
router.get('/', userController.getAllUsers);

// @GET /api/v1/users/:id
router.get('/:id', userController.getUserById);

// @PUT /api/v1/users/:id
router.put('/:id', userController.updateUser);

// @DELETE /api/v1/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;

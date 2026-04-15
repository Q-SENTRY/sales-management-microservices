/**
 * Auth Routes
 * Endpoints de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// @POST /api/v1/auth/register
router.post('/register', authController.register);

// @POST /api/v1/auth/login
router.post('/login', authController.login);

// @POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;

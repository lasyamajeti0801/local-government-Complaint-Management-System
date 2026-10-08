// ============================================================
// NAGAR CONNECT - AUTH ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.registerCitizen);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;

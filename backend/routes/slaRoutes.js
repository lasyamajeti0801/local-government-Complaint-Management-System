// ============================================================
// NAGAR CONNECT - SLA ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const slaController = require('../controllers/slaController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/rules', slaController.getRules);
router.post('/refresh', slaController.refreshSla);

module.exports = router;

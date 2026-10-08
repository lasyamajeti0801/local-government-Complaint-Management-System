// ============================================================
// NAGAR CONNECT - NOTIFICATION ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Get user notifications
router.get('/', (req, res) => {
  const notifs = db.all(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `, [req.user.id]);
  res.json({ success: true, data: notifs });
});

// Mark notification as read
router.post('/:id/read', (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Mark all as read
router.post('/read-all', (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;

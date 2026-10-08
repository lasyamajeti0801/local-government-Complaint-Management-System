/**
 * Nagar Connect - Administrative & System Settings Routes
 */
const express = require('express');
const router = express.Router();
const { query: dbQuery, run: dbRun, get: dbGet } = require('../../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);
router.use(requireRole(['MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN']));

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await dbQuery(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.phone, u.ward_number, u.is_active, u.created_at,
             d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await dbQuery(`
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json({ auditLogs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/notices
router.get('/notices', async (req, res) => {
  try {
    const notices = await dbQuery(`
      SELECT n.*, d.name as department_name
      FROM municipal_notices n
      LEFT JOIN departments d ON n.department_id = d.id
      ORDER BY n.published_at DESC
    `);
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/notices
router.post('/notices', async (req, res) => {
  try {
    const { title, content, department_id, priority = 'NORMAL' } = req.body;
    const nid = `NOT_${Date.now()}`;

    await dbRun(`
      INSERT INTO municipal_notices (id, title, content, department_id, priority, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [nid, title, content, department_id || null, priority]);

    res.status(201).json({ message: 'Notice published', noticeId: nid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await dbQuery('SELECT * FROM system_settings');
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

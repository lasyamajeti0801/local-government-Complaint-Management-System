const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/departments - List all municipal departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM complaints c WHERE c.department_id = d.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) as active_complaints,
        (SELECT COUNT(*) FROM documents doc WHERE doc.department_id = d.id AND doc.status = 'ACTIVE') as document_count
      FROM departments d
      WHERE d.is_active = 1
      ORDER BY d.name ASC
    `);
    res.json({ success: true, departments });
  } catch (err) {
    console.error('Fetch departments error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve departments.' });
  }
});

// GET /api/categories - List complaint categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, d.name as department_name, d.code as department_code
      FROM complaint_categories c
      JOIN departments d ON c.department_id = d.id
      WHERE c.is_active = 1
      ORDER BY d.name, c.name ASC
    `);
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

// GET /api/notices - List public municipal notices
router.get('/notices', async (req, res) => {
  try {
    const notices = await query(`
      SELECT n.*, d.name as department_name
      FROM municipal_notices n
      LEFT JOIN departments d ON n.department_id = d.id
      WHERE n.is_active = 1
      ORDER BY n.published_at DESC LIMIT 10
    `);
    res.json({ success: true, notices });
  } catch (err) {
    console.error('Fetch notices error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve notices.' });
  }
});

// GET /api/users/staff - List available field technicians for officer assignment
router.get('/users/staff', authenticateToken, async (req, res) => {
  try {
    const staff = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.department_id, u.designation, u.ward_number, d.name as department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE r.name = 'FIELD_STAFF' AND u.is_active = 1
      ORDER BY u.full_name ASC
    `);
    res.json({ success: true, staff });
  } catch (err) {
    console.error('Fetch staff error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve field staff.' });
  }
});

// GET /api/notifications - User notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 25
    `, [req.user.id]);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

module.exports = router;

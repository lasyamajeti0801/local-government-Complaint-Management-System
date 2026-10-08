/**
 * Nagar Connect - Authentication Routes
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get: dbGet, query: dbQuery, run: dbRun } = require('../../database/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ? AND is_active = 1', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email credentials' });
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid password credentials' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      ward_number: user.ward_number,
      avatar: user.avatar
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(user.id, user.role, 'USER_LOGIN', 'USER', user.id, { email: user.email }, req.ip);

    res.json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /api/auth/demo-login - Quick Switcher for Testing Demo Accounts
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'CITIZEN' } = req.body;

    const user = await dbGet('SELECT * FROM users WHERE role = ? AND is_active = 1 LIMIT 1', [role.toUpperCase()]);
    if (!user) {
      return res.status(404).json({ error: `Demo account for role ${role} not found` });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      ward_number: user.ward_number,
      avatar: user.avatar
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(user.id, user.role, 'DEMO_LOGIN_SWITCH', 'USER', user.id, { role: user.role }, req.ip);

    res.json({
      message: `Switched to demo role ${role}`,
      token,
      user: payload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.phone, u.ward_number, u.avatar,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (req, res) => {
  try {
    const users = await dbQuery(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.ward_number, u.avatar,
             d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.is_active = 1
      ORDER BY 
        CASE u.role
          WHEN 'CITIZEN' THEN 1
          WHEN 'OFFICER' THEN 2
          WHEN 'FIELD_STAFF' THEN 3
          WHEN 'MUNICIPAL_ADMIN' THEN 4
          WHEN 'COMMISSIONER' THEN 5
          WHEN 'KNOWLEDGE_ADMIN' THEN 6
          WHEN 'SUPER_ADMIN' THEN 7
          ELSE 8
        END
    `);
    res.json({ demoUsers: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

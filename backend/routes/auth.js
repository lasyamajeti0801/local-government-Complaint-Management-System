const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, query, run } = require('../../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await queryOne(`
      SELECT 
        u.id, u.full_name, u.email, u.password_hash, u.phone,
        u.role_id, r.name as role_name, u.department_id, d.name as department_name,
        u.designation, u.employee_id, u.ward_number, u.is_active
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.email) = LOWER(?)
    `, [email.trim()]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact Municipal Administration.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_name,
        department_id: user.department_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'LOGIN', 'USER', ?, ?)
    `, [`aud_${Date.now()}`, user.id, user.id, JSON.stringify({ email: user.email, role: user.role_name })]);

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// GET /api/auth/demo-accounts (Helper for rapid switching during review)
router.get('/demo-accounts', async (req, res) => {
  const demoUsers = [
    { role: 'CITIZEN', email: 'citizen@nagarconnect.gov.in', password: 'Citizen@123', label: 'Resident Citizen (Priya Sharma)' },
    { role: 'OFFICER', email: 'officer.water@nagarconnect.gov.in', password: 'Officer@123', label: 'Water Nodal Officer (Er. Verma)' },
    { role: 'OFFICER', email: 'officer.sanitation@nagarconnect.gov.in', password: 'Officer@123', label: 'Sanitation Inspector (Dr. Deshmukh)' },
    { role: 'FIELD_STAFF', email: 'field.ramesh@nagarconnect.gov.in', password: 'Field@123', label: 'Field Staff (Ramesh Kumar)' },
    { role: 'MUNICIPAL_ADMIN', email: 'admin@nagarconnect.gov.in', password: 'Admin@123', label: 'Additional Commissioner (S. Kulkarni)' },
    { role: 'COMMISSIONER', email: 'commissioner@nagarconnect.gov.in', password: 'Comm@123', label: 'Municipal Commissioner (IAS)' },
    { role: 'KNOWLEDGE_ADMIN', email: 'knowledge.admin@nagarconnect.gov.in', password: 'Know@123', label: 'Knowledge / RAG Admin (V. Sengupta)' },
    { role: 'SUPER_ADMIN', email: 'superadmin@nagarconnect.gov.in', password: 'Super@123', label: 'Super Admin (Security CISO)' }
  ];

  res.json({
    success: true,
    accounts: demoUsers
  });
});

module.exports = router;

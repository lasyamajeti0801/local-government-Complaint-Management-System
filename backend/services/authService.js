// ============================================================
// NAGAR CONNECT - AUTHENTICATION SERVICE
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

class AuthService {
  // Login user and generate signed JWT
  login(email, password) {
    if (!email || !password) {
      const err = new Error('Please provide both email and password.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.get(`
      SELECT u.id, u.name, u.email, u.password_hash, u.phone, u.role, u.department_id,
             u.employee_id, u.designation, u.ward_number, u.is_active,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.email) = ?
    `, [normalizedEmail]);

    if (!user) {
      const err = new Error('Invalid municipal credentials.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('Your municipal account is inactive. Please contact your administrative nodal officer.');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid municipal credentials.');
      err.statusCode = 401;
      throw err;
    }

    // Log successful login in audit logs
    try {
      db.run(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, 'LOGIN', 'USER', ?, ?)
      `, [`aud-${Date.now()}`, user.id, user.id, JSON.stringify({ role: user.role, time: new Date().toISOString() })]);
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        department_id: user.department_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        employee_id: user.employee_id,
        designation: user.designation,
        ward_number: user.ward_number
      }
    };
  }

  // Register a new citizen
  registerCitizen({ name, email, password, phone, ward_number }) {
    if (!name || !email || !password) {
      throw { statusCode: 400, message: 'Name, email, and password are required.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existing) {
      throw { statusCode: 409, message: 'An account with this email address already exists.' };
    }

    const userId = `usr-cit-${Date.now()}`;
    const hash = bcrypt.hashSync(password, 10);

    db.run(`
      INSERT INTO users (id, name, email, password_hash, phone, role, ward_number, is_active)
      VALUES (?, ?, ?, ?, ?, 'CITIZEN', ?, 1)
    `, [userId, name.trim(), normalizedEmail, hash, phone || null, ward_number || null]);

    return this.login(normalizedEmail, password);
  }

  // Get user profile with current stats
  getProfile(userId) {
    const user = db.get(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.department_id, u.employee_id,
             u.designation, u.ward_number, u.created_at,
             d.name as department_name, d.code as department_code, d.helpline as department_helpline
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [userId]);

    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    return user;
  }
}

module.exports = new AuthService();

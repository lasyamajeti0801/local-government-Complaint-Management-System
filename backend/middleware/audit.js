/**
 * Nagar Connect - Central Audit Logging Middleware
 */
const { run: dbRun } = require('../../database/db');

async function logAudit(userId, userRole, action, entityType, entityId, details = {}, ip = '127.0.0.1') {
  try {
    const logId = `AUD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await dbRun(
      `INSERT INTO audit_logs (id, user_id, user_role, action, entity_type, entity_id, details_json, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        userId || 'SYSTEM',
        userRole || 'SYSTEM',
        action,
        entityType,
        entityId ? String(entityId) : null,
        typeof details === 'object' ? JSON.stringify(details) : String(details),
        ip
      ]
    );
  } catch (err) {
    console.warn('⚠️ Failed to write audit log:', err.message);
  }
}

function auditMiddleware(action, entityType) {
  return (req, res, next) => {
    // Intercept response finish
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id || 'GUEST';
        const userRole = req.user?.role || 'CITIZEN';
        const entityId = req.params?.id || req.body?.id || null;
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        logAudit(userId, userRole, action, entityType, entityId, { path: req.originalUrl, method: req.method }, ip);
      }
    });
    next();
  };
}

module.exports = {
  logAudit,
  auditMiddleware
};

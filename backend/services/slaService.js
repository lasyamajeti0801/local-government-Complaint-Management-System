// ============================================================
// NAGAR CONNECT - SLA (SERVICE LEVEL AGREEMENT) SERVICE
// ============================================================

const db = require('../config/db');

class SlaService {
  // Calculate SLA deadline based on department, category, and priority
  calculateSlaDeadline(departmentId, categoryId, priority = 'MEDIUM') {
    // 1. Try matching exact SLA rule for category + priority
    let rule = null;
    if (categoryId) {
      rule = db.get(`
        SELECT resolution_time_hours, escalation_time_hours
        FROM sla_rules
        WHERE category_id = ? AND priority = ?
      `, [categoryId, priority]);
    }

    // 2. Try department + priority rule
    if (!rule && departmentId) {
      rule = db.get(`
        SELECT resolution_time_hours, escalation_time_hours
        FROM sla_rules
        WHERE department_id = ? AND priority = ? AND category_id IS NULL
      `, [departmentId, priority]);
    }

    let resolutionHours;
    if (rule) {
      resolutionHours = rule.resolution_time_hours;
    } else {
      // 3. Category default SLA hours
      const cat = categoryId ? db.get('SELECT default_sla_hours FROM complaint_categories WHERE id = ?', [categoryId]) : null;
      if (cat && cat.default_sla_hours) {
        resolutionHours = cat.default_sla_hours;
      } else {
        // 4. Default priority SLA fallback
        const priorityDefaults = {
          CRITICAL: 12,
          HIGH: 24,
          MEDIUM: 72,
          LOW: 120
        };
        resolutionHours = priorityDefaults[priority] || 72;
      }
    }

    const deadline = new Date(Date.now() + resolutionHours * 3600 * 1000);
    return {
      resolutionHours,
      deadlineIso: deadline.toISOString()
    };
  }

  // Calculate live remaining time metrics for a complaint
  computeSlaMetrics(slaDeadlineStr, status) {
    if (!slaDeadlineStr) {
      return {
        remainingHours: null,
        formattedRemaining: 'No SLA Set',
        slaStatus: 'ON_TRACK',
        isOverdue: false,
        percentElapsed: 0
      };
    }

    // If resolved or closed, SLA clock stops
    const isCompleted = ['RESOLVED', 'CLOSED', 'REJECTED'].includes(status);

    const now = Date.now();
    const deadline = new Date(slaDeadlineStr).getTime();
    const diffMs = deadline - now;
    const diffHours = Math.round(diffMs / (3600 * 1000));
    const diffMinutes = Math.round(diffMs / (60 * 1000));

    if (diffMs < 0) {
      const overdueHours = Math.abs(diffHours);
      return {
        remainingHours: diffHours,
        formattedRemaining: `Overdue by ${overdueHours}h`,
        slaStatus: 'OVERDUE',
        isOverdue: true,
        isCompleted
      };
    } else if (diffHours <= 6) {
      return {
        remainingHours: diffHours,
        formattedRemaining: `${diffHours > 0 ? diffHours + 'h left' : diffMinutes + 'm left'} (Critical)`,
        slaStatus: 'APPROACHING_DEADLINE',
        isOverdue: false,
        isCompleted
      };
    } else if (diffHours < 24) {
      return {
        remainingHours: diffHours,
        formattedRemaining: `${diffHours}h remaining`,
        slaStatus: 'ON_TRACK',
        isOverdue: false,
        isCompleted
      };
    } else {
      const days = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;
      return {
        remainingHours: diffHours,
        formattedRemaining: `${days}d ${remHours}h remaining`,
        slaStatus: 'ON_TRACK',
        isOverdue: false,
        isCompleted
      };
    }
  }

  // Refresh SLA status across all active complaints
  refreshActiveComplaintsSla() {
    const activeComplaints = db.all(`
      SELECT id, sla_deadline, status
      FROM complaints
      WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
        AND sla_deadline IS NOT NULL
    `);

    const updateStmt = db.db.prepare('UPDATE complaints SET sla_status = ? WHERE id = ?');
    let updatedCount = 0;

    for (const c of activeComplaints) {
      const metrics = this.computeSlaMetrics(c.sla_deadline, c.status);
      updateStmt.run(metrics.slaStatus, c.id);
      updatedCount++;
    }

    return updatedCount;
  }

  // Get department SLA rules
  getRules(departmentId = null) {
    let sql = `
      SELECT r.*, d.name as department_name, c.name as category_name
      FROM sla_rules r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN complaint_categories c ON r.category_id = c.id
    `;
    const params = [];
    if (departmentId) {
      sql += ' WHERE r.department_id = ?';
      params.push(departmentId);
    }
    sql += ' ORDER BY r.priority ASC';
    return db.all(sql, params);
  }
}

module.exports = new SlaService();

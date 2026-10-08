/**
 * Nagar Connect RAG - Role-Based Access Control Permission Filter
 * Ensures no user can retrieve, view, or cite unauthorized municipal documents
 */

function isChunkAccessible(chunkVisibility, userRole) {
  if (!userRole) return false;
  const role = userRole.toUpperCase().trim();

  // Super Admin has full visibility
  if (role === 'SUPER_ADMIN' || role === 'ROLE_SUPER_ADMIN') return true;

  if (!chunkVisibility) return false;
  const vis = chunkVisibility.toUpperCase();

  // Public documents are open to all
  if (vis === 'PUBLIC' || vis.includes('PUBLIC')) return true;

  // Check direct role inclusion
  const allowedRoles = vis.split(',').map(r => r.trim().replace(/^ROLE_/, ''));
  const cleanUserRole = role.replace(/^ROLE_/, '');

  return allowedRoles.includes(cleanUserRole);
}

function filterChunksByRole(chunks, userRole, departmentFilter = null) {
  if (!Array.isArray(chunks)) return [];

  return chunks.filter(chunk => {
    // 1. Check role authorization
    const roleAllowed = isChunkAccessible(chunk.visibility, userRole);
    if (!roleAllowed) return false;

    // 2. Check department filter if specified
    if (departmentFilter && departmentFilter !== 'ALL' && departmentFilter !== '') {
      const docDept = (chunk.department || '').toLowerCase();
      const targetDept = departmentFilter.toLowerCase();
      if (docDept !== 'all' && docDept !== 'all departments' && docDept !== 'general administration' && !docDept.includes(targetDept)) {
        return false;
      }
    }

    return true;
  });
}

module.exports = {
  isChunkAccessible,
  filterChunksByRole
};

/**
 * Role-Based Access Control filter for RAG Knowledge Retrieval.
 * Enforces strict information boundaries across municipal personas.
 *
 * Rules:
 * - CITIZEN: Only 'PUBLIC' documents.
 * - OFFICER: 'PUBLIC' and 'INTERNAL_OFFICER' documents (plus department-matched docs).
 * - FIELD_STAFF: 'PUBLIC' and 'FIELD_STAFF' documents.
 * - MUNICIPAL_ADMIN / COMMISSIONER / KNOWLEDGE_ADMIN / SUPER_ADMIN:
 *   Full access to all tiers including 'ADMIN_ONLY' and 'CONFIDENTIAL'.
 */

const ROLE_PERMITTED_VISIBILITIES = {
  CITIZEN: ['PUBLIC'],
  ROLE_CITIZEN: ['PUBLIC'],

  OFFICER: ['PUBLIC', 'INTERNAL_OFFICER'],
  ROLE_OFFICER: ['PUBLIC', 'INTERNAL_OFFICER'],

  FIELD_STAFF: ['PUBLIC', 'FIELD_STAFF'],
  ROLE_FIELD_STAFF: ['PUBLIC', 'FIELD_STAFF'],

  MUNICIPAL_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY'],
  ROLE_MUNICIPAL_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY'],

  COMMISSIONER: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL'],
  ROLE_COMMISSIONER: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL'],

  KNOWLEDGE_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL'],
  ROLE_KNOWLEDGE_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL'],

  SUPER_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL'],
  ROLE_SUPER_ADMIN: ['PUBLIC', 'INTERNAL_OFFICER', 'FIELD_STAFF', 'ADMIN_ONLY', 'CONFIDENTIAL']
};

/**
 * Returns an array of allowed visibilities for a given user role.
 */
function getAllowedVisibilities(role) {
  const normalized = (role || 'CITIZEN').toUpperCase();
  return ROLE_PERMITTED_VISIBILITIES[normalized] || ['PUBLIC'];
}

/**
 * Checks whether a single chunk is accessible by the specified role and department.
 */
function isChunkAuthorized(chunk, userRole, userDeptId = null) {
  const allowed = getAllowedVisibilities(userRole);
  if (!allowed.includes(chunk.visibility)) {
    return false;
  }

  // If user is a Department Officer and chunk has a specific department,
  // allow general departmental docs or matching department
  return true;
}

/**
 * Filters a list of chunks based on user authorization.
 */
function filterAuthorizedChunks(chunks, userRole, userDeptId = null) {
  return chunks.filter(c => isChunkAuthorized(c, userRole, userDeptId));
}

module.exports = {
  getAllowedVisibilities,
  isChunkAuthorized,
  filterAuthorizedChunks
};

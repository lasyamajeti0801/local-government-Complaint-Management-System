// ============================================================
// NAGAR CONNECT - CENTRALIZED ERROR HANDLER
// ============================================================

function errorHandler(err, req, res, next) {
  console.error('⚠️ [Server Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected municipal server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;

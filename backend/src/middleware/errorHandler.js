// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ error: 'Database constraint violation' });
  }

  // Network/RPC errors
  if (err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR') {
    return res.status(503).json({ error: 'External service unavailable' });
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Default error
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    method: req.method
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
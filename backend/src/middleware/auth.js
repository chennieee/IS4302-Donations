const config = require('../../config');

// Simple API key authentication middleware
function authenticateApiKey(req, res, next) {
  const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== config.security.apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

// Optional API key authentication (for public endpoints that can benefit from auth)
function optionalAuth(req, res, next) {
  const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');

  if (apiKey && apiKey === config.security.apiKey) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

module.exports = {
  authenticateApiKey,
  optionalAuth
};
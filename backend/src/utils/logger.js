const winston = require('winston');
const config = require('../../config');

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'donations-backend',
    environment: config.env
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (config.env === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

// Create express middleware for request logging
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = {
  logger,
  requestLogger
};
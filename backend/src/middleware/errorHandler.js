// Consistent JSON error shape for 404/500 responses
function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, error: `Duplicate value for ${field}` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
}

module.exports = { notFound, errorHandler };

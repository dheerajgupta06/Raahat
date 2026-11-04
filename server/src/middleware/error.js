import config from '../config/env.js';

export function requestLogger(req, res, next) {
  if (req.path.startsWith('/socket.io')) return next();
  const startedAt = Date.now();
  res.on('finish', () => {
    if (config.nodeEnv === 'test') return;
    const ms = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Unexpected server error';
  let errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((item) => ({ path: item.path, message: item.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    message = 'An account with this email already exists';
  } else if (err.name === 'ZodError') {
    status = 400;
    message = 'Validation failed';
    errors = err.issues?.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

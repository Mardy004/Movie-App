import config from '../config/index.js';
import { HttpError, fail } from '../utils/http.js';

/** Terminal error middleware - converts thrown HttpErrors into the shared envelope. */
export function errorHandler(err, req, res, _next) {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  const message = err instanceof HttpError ? err.message : 'Unexpected server error';
  // Intentional HttpErrors (400/401/404/503...) are expected flow; only genuinely
  // unexpected failures get logged.
  if (!(err instanceof HttpError)) {
    // eslint-disable-next-line no-console
    console.error(`[movies-api] ${req.method} ${req.originalUrl} ->`, err);
  }
  return fail(res, status, message, err.details);
}

/** 404 fallback for unknown API routes. */
export function notFound(req, res) {
  return fail(res, 404, `No route matches ${req.method} ${req.originalUrl}`);
}

/** Minimal request logger (keeps the dependency list tiny). */
export function requestLogger(req, res, next) {
  if (config.env === 'test') return next();
  const started = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - started;
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  return next();
}

export default { errorHandler, notFound, requestLogger };

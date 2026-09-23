/** Error type carrying an HTTP status code, thrown anywhere in the request lifecycle. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    if (details) this.details = details;
  }

  static badRequest(message, details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Admin access required') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(404, message);
  }

  static serviceUnavailable(message, details) {
    return new HttpError(503, message, details);
  }
}

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

/** Uniform success envelope. */
export const ok = (res, data, meta) => {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.json(payload);
};

/** Uniform error envelope. */
export const fail = (res, status, message, details) => {
  const payload = { success: false, error: { message } };
  if (details) payload.error.details = details;
  return res.status(status).json(payload);
};

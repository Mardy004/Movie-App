import crypto from 'node:crypto';
import config from '../config/index.js';
import { HttpError } from '../utils/http.js';

/**
 * Stateless admin sessions: HMAC-SHA256 signed payload, no database lookups and
 * no extra dependency. Swap for JWT/OAuth later if you need refresh tokens.
 */
const SECRET = () => config.auth.secret;
const now = () => Math.floor(Date.now() / 1000);
const sign = (data) => crypto.createHmac('sha256', SECRET()).update(data).digest('base64url');
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

export function signToken(payload, ttlSeconds = config.auth.ttlSeconds) {
  const body = { ...payload, iat: now(), exp: now() + ttlSeconds };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${data}.${sign(data)}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || token.split('.').length !== 2) return null;
  const [data, signature] = token.split('.');
  const expected = sign(data);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time credential check against the ADMIN_USERNAME / ADMIN_PASSWORD env values. */
export function checkCredentials(username, password) {
  const expectedUser = sha256(config.admin.username);
  const expectedPass = sha256(config.admin.password);
  const givenUser = sha256(username ?? '');
  const givenPass = sha256(password ?? '');
  return crypto.timingSafeEqual(expectedUser, givenUser) && crypto.timingSafeEqual(expectedPass, givenPass);
}

const readToken = (req) => {
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return req.get('x-admin-token') || null;
};

/** Attaches req.user when a valid token is present; never blocks the request. */
export function optionalAuth(req, _res, next) {
  const payload = verifyToken(readToken(req));
  if (payload) req.user = payload;
  next();
}

/** Blocks non-admin traffic on write endpoints. */
export function requireAdmin(req, _res, next) {
  const payload = verifyToken(readToken(req));
  if (!payload) return next(HttpError.unauthorized('Admin sign-in is required for this action'));
  if (payload.role !== 'admin') return next(HttpError.forbidden());
  req.user = payload;
  return next();
}

export const authDefaults = { username: config.admin.username, displayName: config.admin.displayName };

export default { signToken, verifyToken, checkCredentials, optionalAuth, requireAdmin };

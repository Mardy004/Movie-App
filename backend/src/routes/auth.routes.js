import { Router } from 'express';
import config from '../config/index.js';
import { HttpError, asyncHandler, ok } from '../utils/http.js';
import { checkCredentials, requireAdmin, signToken, verifyToken } from '../middleware/auth.js';

const router = Router();

const publicUser = () => ({
  username: config.admin.username,
  displayName: config.admin.displayName,
  email: config.admin.email,
  role: 'admin',
});

/** POST /api/auth/login  { username, password } -> { token, user, expiresIn } */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) throw HttpError.badRequest('username and password are required');
    if (!checkCredentials(username, password)) throw HttpError.unauthorized('Invalid username or password');
    const token = signToken({ sub: config.admin.username, role: 'admin' });
    return ok(res, { token, user: publicUser(), expiresIn: config.auth.ttlSeconds, tokenType: 'Bearer' });
  }),
);

/** GET /api/auth/me - validates the stored token. */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const header = req.get('authorization') || '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : req.get('x-admin-token');
    const payload = verifyToken(token);
    if (!payload) throw HttpError.unauthorized('Session expired, please sign in again');
    return ok(res, { user: { ...publicUser(), tokenIssuedAt: new Date(payload.iat * 1000).toISOString() } });
  }),
);

/** POST /api/auth/logout - tokens are stateless, the client just drops it. */
router.post('/logout', (req, res) => ok(res, { loggedOut: true }));

/** GET /api/auth/session - quick probe used by the admin UI boot sequence. */
router.get('/session', requireAdmin, (req, res) => ok(res, { user: publicUser(), verified: true }));

export default router;

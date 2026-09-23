import { Router } from 'express';
import { asyncHandler, ok } from '../utils/http.js';
import { requireAdmin } from '../middleware/auth.js';
import * as movies from '../services/movies.service.js';
import * as provider from '../services/provider.js';
import * as comments from '../services/comments.service.js';

const router = Router();

/** Everything below the /api/admin prefix requires an admin token. */
router.use(requireAdmin);

/** GET /api/admin/stats - numbers for the dashboard cards. */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await movies.stats();
    const commentStats = await comments.adminStats();
    return ok(res, { ...stats, comments: commentStats });
  }),
);

/** GET /api/admin/provider - is the external API wired up? */
router.get(
  '/provider',
  asyncHandler(async (_req, res) => ok(res, provider.providerInfo())),
);

/** POST /api/admin/seed  { force } - restore the demo catalogue. */
router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const force = req.body?.force === true || String(req.query.force) === 'true';
    return ok(res, await movies.seedDatabase({ force }));
  }),
);

/** POST /api/admin/import  { externalId, refresh } - import one title from your API. */
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const externalId = req.body?.externalId ?? req.body?.id;
    if (!externalId) {
      return res.status(400).json({ success: false, error: { message: 'externalId is required' } });
    }
    const result = await provider.importFromProvider(externalId, { refresh: req.body?.refresh === true });
    return ok(res.status(result.action === 'created' ? 201 : 200), result);
  }),
);

/** POST /api/admin/import/trending  { limit, refresh } - bulk import from your API. */
router.post(
  '/import/trending',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.body?.limit) || 5, 1), 20);
    const result = await provider.importTrending({ limit, refresh: req.body?.refresh === true });
    return ok(res, result, { lastImportAt: new Date().toISOString() });
  }),
);

export default router;

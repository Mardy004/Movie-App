import { Router } from 'express';
import { asyncHandler, ok } from '../utils/http.js';
import * as provider from '../services/provider.js';
import { listGenres, SORT_OPTIONS, stats } from '../services/movies.service.js';

const router = Router();

/** GET /api/health - used by the frontend status pill and by `npm run check`. */
router.get('/health', (req, res) =>
  ok(res, {
    status: 'ok',
    service: 'movie-show-backend',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }),
);

/** GET /api/meta - everything the UI needs to boot (sorts, genres, provider state). */
router.get(
  '/meta',
  asyncHandler(async (_req, res) =>
    ok(res, {
      appName: 'MovieShow',
      version: 1,
      sorts: Object.entries(SORT_OPTIONS).map(([value, label]) => ({ value, label })),
      genres: await listGenres(),
      overview: await stats(),
      provider: provider.providerInfo(),
    }),
  ),
);

/** Live passthrough to the external API (nothing is persisted). */
router.get(
  '/provider/trending',
  asyncHandler(async (req, res) =>
    ok(res, await provider.fetchTrending({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 12 })),
  ),
);

/** Amazon-style browse categories straight from TMDB (popular / top-rated / upcoming). */
router.get(
  '/provider/popular',
  asyncHandler(async (req, res) =>
    ok(res, await provider.fetchProviderList('popular', { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 })),
  ),
);

router.get(
  '/provider/top-rated',
  asyncHandler(async (req, res) =>
    ok(res, await provider.fetchProviderList('top-rated', { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 })),
  ),
);

router.get(
  '/provider/upcoming',
  asyncHandler(async (req, res) =>
    ok(res, await provider.fetchProviderList('upcoming', { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 })),
  ),
);

/** Rich single-title payload (genres, cast, trailer) without importing it. */
router.get(
  '/provider/detail/:externalId',
  asyncHandler(async (req, res) => ok(res, await provider.fetchProviderDetail(req.params.externalId))),
);

router.get(
  '/provider/search',
  asyncHandler(async (req, res) =>
    ok(res, await provider.searchExternal(String(req.query.q || ''), { page: Number(req.query.page) || 1 })),
  ),
);

router.get(
  '/provider/id/:externalId',
  asyncHandler(async (req, res) => ok(res, await provider.fetchExternalMovie(req.params.externalId))),
);

export default router;

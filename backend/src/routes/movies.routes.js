import { Router } from 'express';
import { asyncHandler, ok } from '../utils/http.js';
import { requireAdmin } from '../middleware/auth.js';
import * as movies from '../services/movies.service.js';
import * as stream from '../services/stream.service.js';

const router = Router();

/** GET /api/movies?sort=trending|recently-added|recent|rating|views|title&q=&genre=&page=&limit= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { items, meta } = await movies.listMovies(req.query);
    return ok(res, items, meta);
  }),
);

router.get(
  '/genres',
  asyncHandler(async (_req, res) => ok(res, await movies.listGenres())),
);

router.get(
  '/sort-options',
  asyncHandler(async (_req, res) =>
    ok(res, Object.entries(movies.SORT_OPTIONS).map(([value, label]) => ({ value, label }))),
  ),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await movies.getMovie(req.params.id))),
);

// ---- admin CRUD ------------------------------------------------------------
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => ok(res.status(201), await movies.createMovie(req.body))),
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => ok(res, await movies.updateMovie(req.params.id, req.body))),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => ok(res, await movies.updateMovie(req.params.id, req.body))),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const removed = await movies.deleteMovie(req.params.id);
    return ok(res, { id: removed.id, title: removed.title, deleted: true });
  }),
);

// ---- public engagement (feeds trending) ------------------------------------
router.get(
  '/:id/watch',
  asyncHandler(async (req, res) => ok(res, await stream.resolveWatch(req.params.id))),
);

router.get(
  '/:id/stream',
  asyncHandler(async (req, res) =>
    stream.streamMovie(req.params.id, {
      rangeHeader: req.get('range') || null,
      download: String(req.query.download) === '1' || String(req.query.download) === 'true',
    }, res),
  ),
);

router.post(
  '/:id/view',
  asyncHandler(async (req, res) => {
    const movie = await movies.registerView(req.params.id);
    return ok(res, { id: movie.id, views: movie.views, trendingScore: movie.trendingScore });
  }),
);

router.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const movie = await movies.likeMovie(req.params.id, 1);
    return ok(res, { id: movie.id, likes: movie.likes, trendingScore: movie.trendingScore });
  }),
);

router.delete(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const movie = await movies.likeMovie(req.params.id, -1);
    return ok(res, { id: movie.id, likes: movie.likes, trendingScore: movie.trendingScore });
  }),
);

export default router;

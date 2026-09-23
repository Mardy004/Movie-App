import { Router } from 'express';
import { asyncHandler, ok } from '../utils/http.js';
import { requireAdmin } from '../middleware/auth.js';
import * as comments from '../services/comments.service.js';

const router = Router({ mergeParams: true });

/** GET /api/movies/:id/comments - public thread for one movie. */
router.get(
  '/',
  asyncHandler(async (req, res) => ok(res, await comments.listByMovie(req.params.id))),
);

/** POST /api/movies/:id/comments  { name, email, body } - public, email required. */
router.post(
  '/',
  asyncHandler(async (req, res) =>
    ok(res.status(201), await comments.addComment(req.params.id, req.body || {})),
  ),
);

/** DELETE /api/movies/:id/comments/:commentId - admin only. */
router.delete(
  '/:commentId',
  requireAdmin,
  asyncHandler(async (req, res) => ok(res, await comments.removeComment(req.params.id, req.params.commentId))),
);

/** POST /api/movies/:id/comments/:commentId/reply  { body } - admin only. */
router.post(
  '/:commentId/reply',
  requireAdmin,
  asyncHandler(async (req, res) =>
    ok(res, await comments.addAdminReply(req.params.id, req.params.commentId, req.body || {}, req.user)),
  ),
);

export default router;

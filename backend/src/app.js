import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { errorHandler, notFound, requestLogger } from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import moviesRoutes from './routes/movies.routes.js';
import adminRoutes from './routes/admin.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import metaRoutes from './routes/meta.routes.js';
import * as store from './store/jsonStore.js';
import { seedDatabase } from './services/movies.service.js';

/**
 * Cold-start initialisation shared by every app instance. `src/server.js` runs the
 * same steps before listen() when the API runs as a long-lived process; on
 * serverless hosts (Vercel invokes the default export directly, there is no
 * listen() step) the first request passes through a gate below instead. Both
 * calls are idempotent, so running them twice is harmless.
 */
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await store.ensure();

      // First run => fill the catalogue so the UI is never empty.
      if (String(process.env.AUTO_SEED ?? 'true') !== 'false') {
        const result = await seedDatabase({ force: false });
        if (result.seeded) console.log(`[movies-api] seeded ${result.count} demo movies`);
      }
    })().catch((error) => {
      readyPromise = null; // let the next request retry a failed initialisation
      throw error;
    });
  }
  return readyPromise;
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Block requests until the store is initialised and seeded (serverless cold start).
  app.use((_req, _res, next) => {
    ensureReady().then(() => next(), next);
  });

  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(optionalAuth);

  // Friendly root so hitting the API directly is not a 404 wall.
  app.get('/', (_req, res) =>
    res.json({
      success: true,
      data: {
        service: 'MovieShow API',
        docs: ['/api/health', '/api/meta', '/api/movies?sort=trending', '/api/auth/login', '/api/admin/stats'],
      },
    }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', moviesRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/movies/:id/comments', commentsRoutes);
  app.use('/api', metaRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Vercel's zero-configuration Express runtime treats this module's default export
// as the request handler, so it must be an app *instance*. Exporting the
// createApp factory here made every invocation call `createApp(req, res)`, which
// builds a fresh app but never writes a response - the request then hung until
// FUNCTION_INVOCATION_TIMEOUT.
export default createApp();

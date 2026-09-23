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

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

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

export default createApp;

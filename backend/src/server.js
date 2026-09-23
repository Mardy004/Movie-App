import { createApp } from './app.js';
import config from './config/index.js';
import * as store from './store/jsonStore.js';
import { seedDatabase, stats } from './services/movies.service.js';
import { providerInfo } from './services/provider.js';

async function bootstrap() {
  await store.ensure();

  // First run => fill the catalogue so the UI is never empty.
  if (String(process.env.AUTO_SEED ?? 'true') !== 'false') {
    const result = await seedDatabase({ force: false });
    if (result.seeded) console.log(`[movies-api] seeded ${result.count} demo movies`);
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    const overview = statsSyncSafe();
    console.log('');
    console.log('  MovieShow backend ready');
    console.log(`  -> http://localhost:${config.port}/api/health`);
    console.log(`  -> http://localhost:${config.port}/api/movies?sort=trending`);
    console.log(`  admin user: ${config.admin.username} / ${config.admin.password}`);
    console.log(`  movies in store: ${overview}`);
    console.log(`  external API: ${providerInfo().configured ? 'configured' : 'NOT configured (set MOVIE_API_KEY in backend/.env)'}`);
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n[movies-api] ${signal} received, closing server...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

function statsSyncSafe() {
  try {
    return store.read().movies.length;
  } catch {
    return 0;
  }
}

void stats;

bootstrap().catch((error) => {
  console.error('[movies-api] failed to start:', error);
  process.exit(1);
});

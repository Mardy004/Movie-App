import * as store from '../store/jsonStore.js';
import { seedDatabase, stats, listMovies } from '../services/movies.service.js';

/** `npm run seed` - force-restores the demo catalogue. */
const force = process.argv.includes('--force') || process.argv.includes('-f');

await store.ensure();
const result = await seedDatabase({ force });
console.log('[seed]', result);

const overview = await stats();
const trending = await listMovies({ sort: 'trending', limit: 3 });
console.log(`[seed] catalogue size: ${overview.totalMovies}, views: ${overview.totalViews}, likes: ${overview.totalLikes}`);
console.log('[seed] top trending:', trending.items.map((movie) => `${movie.title} (${movie.trendingScore})`).join(' | '));

if (!result.seeded) {
  console.log('[seed] Tip: run `npm run seed -- --force` to overwrite existing data.');
}

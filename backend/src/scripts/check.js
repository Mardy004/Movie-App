/**
 * `npm run check` - boots the API on a free port with an isolated database and
 * walks a full admin + public flow over real HTTP, reporting PASS/FAIL per step.
 * Use it any time after changing backend code.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolated throwaway database unless the caller pinned DB_FILE explicitly.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'movieshow-check-'));
process.env.DB_FILE = process.env.CHECK_DB_FILE || path.join(tmpDir, 'db.check.json');
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { createApp } = await import('../app.js');
const store = await import('../store/jsonStore.js');
const { seedDatabase } = await import('../services/movies.service.js');

const results = [];
const server = createApp().listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
await store.ensure();
const seedInfo = await seedDatabase({ force: false });

let token = '';
const step = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
};

const call = async (pathname, { method = 'GET', body, auth = false } = {}) => {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

console.log(`\nMovieShow API smoke check against ${base}`);
console.log(`database: ${process.env.DB_FILE} (${seedInfo.count} movies, seeded=${seedInfo.seeded})\n`);

await step('GET /api/health', async () => {
  const { status, payload } = await call('/api/health');
  expect(status === 200 && payload.data.status === 'ok', `unexpected response ${status}`);
});

await step('POST /api/auth/login (admin credentials)', async () => {
  const { status, payload } = await call('/api/auth/login', {
    method: 'POST',
    body: { username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' },
  });
  expect(status === 200, `login failed with ${status}: ${payload?.error?.message}`);
  token = payload.data.token;
  expect(Boolean(token), 'no token returned');
});

await step('GET /api/movies?sort=trending', async () => {
  const { status, payload } = await call('/api/movies?sort=trending&limit=5');
  expect(status === 200, `status ${status}`);
  expect(payload.data.length > 0, 'catalogue is empty - run `npm run seed`');
  const scores = payload.data.map((movie) => movie.trendingScore);
  expect(JSON.stringify(scores) === JSON.stringify([...scores].sort((a, b) => b - a)), 'trending order is wrong');
});

await step('GET /api/movies?sort=recently-added', async () => {
  const { status, payload } = await call('/api/movies?sort=recently-added&limit=5');
  expect(status === 200, `status ${status}`);
  const dates = payload.data.map((movie) => movie.createdAt);
  expect(JSON.stringify(dates) === JSON.stringify([...dates].sort().reverse()), 'recently added order is wrong');
});

let createdId = null;
await step('POST /api/movies (admin create)', async () => {
  const { status, payload } = await call('/api/movies', {
    method: 'POST',
    auth: true,
    body: {
      title: `Smoke Check Feature ${Date.now()}`,
      overview: 'Created by npm run check.',
      genres: 'Drama, Mystery',
      rating: 7.5,
      releaseDate: '2026-09-22',
    },
  });
  expect(status === 201, `status ${status}: ${payload?.error?.message} ${JSON.stringify(payload?.error?.details || '')}`);
  createdId = payload.data.id;
});

await step('PATCH /api/movies/:id (admin update)', async () => {
  const { status, payload } = await call(`/api/movies/${createdId}`, { method: 'PATCH', auth: true, body: { rating: 8.8, tagline: 'updated' } });
  expect(status === 200 && payload.data.rating === 8.8, `status ${status}`);
});

await step('POST /api/movies/:id/view + like', async () => {
  const view = await call(`/api/movies/${createdId}/view`, { method: 'POST' });
  const like = await call(`/api/movies/${createdId}/like`, { method: 'POST' });
  expect(view.status === 200 && like.status === 200, 'engagement endpoints failed');
});

await step('DELETE /api/movies/:id (admin delete)', async () => {
  const { status } = await call(`/api/movies/${createdId}`, { method: 'DELETE', auth: true });
  expect(status === 200, `status ${status}`);
  const after = await call(`/api/movies/${createdId}`);
  expect(after.status === 404, 'movie still reachable after delete');
});

await step('GET /api/admin/stats', async () => {
  const { status, payload } = await call('/api/admin/stats', { auth: true });
  expect(status === 200 && typeof payload.data.totalMovies === 'number', `status ${status}`);
});

await step('GET /api/meta + /api/movies/genres', async () => {
  const meta = await call('/api/meta');
  const genres = await call('/api/movies/genres');
  expect(meta.status === 200 && genres.status === 200, 'meta endpoints failed');
});

await step('GET /api/provider/trending (external API awareness)', async () => {
  const { status, payload } = await call('/api/provider/trending');
  if (status === 200) {
    console.log('        external API is configured - live titles available');
    return;
  }
  expect(status === 503, `unexpected status ${status}`);
  console.log(`        expected: ${payload.error.message}`);
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('Failed checks:', failed.map((entry) => entry.name).join(', '));
}

await new Promise((resolve) => server.close(resolve));
fs.rmSync(tmpDir, { recursive: true, force: true });
process.exit(failed.length ? 1 : 0);

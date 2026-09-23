import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// --- isolate the test database + admin credentials BEFORE importing the app --
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'movieshow-test-'));
process.env.DB_FILE = path.join(tmpDir, 'db.test.json');
process.env.NODE_ENV = 'test';
process.env.AUTO_SEED = 'false';
process.env.ADMIN_USERNAME = 'tester';
process.env.ADMIN_PASSWORD = 'secret123';
process.env.AUTH_SECRET = 'test-secret';
process.env.MOVIE_API_KEY = ''; // keeps the provider "not configured" path testable

const { createApp } = await import('../src/app.js');

const server = createApp().listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

let token = '';

async function api(pathname, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, payload };
}

const sampleMovie = (overrides = {}) => ({
  title: 'Test Feature',
  tagline: 'Written by the test suite',
  overview: 'A movie created by the automated API smoke test.',
  posterUrl: 'https://example.com/poster.jpg',
  releaseDate: '2026-09-01',
  runtimeMinutes: 101,
  genres: ['Drama', 'Thriller'],
  rating: 7.7,
  popularity: 42,
  status: 'released',
  ...overrides,
});

test('GET /api/health reports ok', async () => {
  const { status, payload } = await api('/api/health', { auth: false });
  assert.equal(status, 200);
  assert.equal(payload.data.status, 'ok');
  assert.equal(payload.success, true);
});

test('POST /api/auth/login rejects bad credentials and accepts the env ones', async () => {
  const bad = await api('/api/auth/login', { method: 'POST', body: { username: 'tester', password: 'nope' }, auth: false });
  assert.equal(bad.status, 401);

  const good = await api('/api/auth/login', { method: 'POST', body: { username: 'tester', password: 'secret123' }, auth: false });
  assert.equal(good.status, 200);
  assert.ok(good.payload.data.token);
  token = good.payload.data.token;

  const me = await api('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.payload.data.user.role, 'admin');
});

test('admin-only writes are blocked without a token', async () => {
  const saved = token;
  token = '';
  const blocked = await api('/api/movies', { method: 'POST', body: sampleMovie(), auth: false });
  assert.equal(blocked.status, 401);
  token = saved;
});

test('POST /api/admin/seed fills an empty catalogue', async () => {
  const { status, payload } = await api('/api/admin/seed', { method: 'POST', body: {} });
  assert.equal(status, 200);
  assert.equal(payload.data.seeded, true);
  assert.ok(payload.data.count >= 10);
});

test('movie CRUD: create -> read -> update -> delete', async () => {
  const created = await api('/api/movies', { method: 'POST', body: sampleMovie() });
  assert.equal(created.status, 201);
  const movie = created.payload.data;
  assert.ok(movie.id);
  assert.deepEqual(movie.genres, ['Drama', 'Thriller']);
  assert.equal(movie.views, 0);

  const fetched = await api(`/api/movies/${movie.id}`, { auth: false });
  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.title, 'Test Feature');

  const patched = await api(`/api/movies/${movie.id}`, { method: 'PATCH', body: { rating: 9.1, genres: 'Crime, Drama' } });
  assert.equal(patched.status, 200);
  assert.equal(patched.payload.data.rating, 9.1);
  assert.deepEqual(patched.payload.data.genres, ['Crime', 'Drama']);

  const removed = await api(`/api/movies/${movie.id}`, { method: 'DELETE' });
  assert.equal(removed.status, 200);
  assert.equal(removed.payload.data.deleted, true);

  const gone = await api(`/api/movies/${movie.id}`, { auth: false });
  assert.equal(gone.status, 404);
});

test('validation errors return 400 with details', async () => {
  const missingTitle = await api('/api/movies', { method: 'POST', body: { overview: 'no title here' } });
  assert.equal(missingTitle.status, 400);
  assert.match(missingTitle.payload.error.message, /validation/i);
  assert.ok(missingTitle.payload.error.details.some((entry) => /title/i.test(entry)));

  const badRating = await api('/api/movies', { method: 'POST', body: sampleMovie({ rating: 44 }) });
  assert.equal(badRating.status, 400);
  assert.ok(badRating.payload.error.details.some((entry) => /rating/i.test(entry)));

  const badUrl = await api('/api/movies', { method: 'POST', body: sampleMovie({ posterUrl: 'not-a-url' }) });
  assert.equal(badUrl.status, 400);
});


test('listing supports sort=trending (score desc) and sort=recently-added (createdAt desc)', async () => {
  const trending = await api('/api/movies?sort=trending&limit=50', { auth: false });
  assert.equal(trending.status, 200);
  const scores = trending.payload.data.map((movie) => movie.trendingScore);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'trending list must be ordered by score');
  assert.equal(trending.payload.meta.sort, 'trending');

  const recent = await api('/api/movies?sort=recently-added&limit=50', { auth: false });
  const created = recent.payload.data.map((movie) => movie.createdAt);
  assert.deepEqual(created, [...created].sort().reverse(), 'recently-added must be newest first');
  assert.equal(recent.payload.meta.sort, 'recently-added');
});

test('search, genre filter and pagination narrow the list', async () => {
  const search = await api('/api/movies?q=signal', { auth: false });
  assert.equal(search.status, 200);
  assert.ok(search.payload.data.length >= 1);
  assert.ok(search.payload.data.every((movie) => /signal/i.test(`${movie.title} ${movie.overview}`)));

  const genres = await api('/api/movies/genres', { auth: false });
  assert.equal(genres.status, 200);
  const first = genres.payload.data[0];
  const filtered = await api(`/api/movies?genre=${encodeURIComponent(first.name)}`, { auth: false });
  assert.ok(filtered.payload.data.length >= 1);
  assert.ok(filtered.payload.data.every((movie) => movie.genres.some((entry) => entry.toLowerCase() === first.name.toLowerCase())));

  const paged = await api('/api/movies?limit=3&page=2', { auth: false });
  assert.equal(paged.payload.data.length, 3);
  assert.equal(paged.payload.meta.page, 2);
  assert.equal(paged.payload.meta.limit, 3);
});

test('views and likes raise the trending score', async () => {
  const created = await api('/api/movies', { method: 'POST', body: sampleMovie({ title: 'Engagement Probe', popularity: 1 }) });
  const movie = created.payload.data;

  const before = movie.trendingScore;
  for (let i = 0; i < 3; i += 1) {
    const view = await api(`/api/movies/${movie.id}/view`, { method: 'POST', auth: false });
    assert.equal(view.status, 200);
  }
  const liked = await api(`/api/movies/${movie.id}/like`, { method: 'POST', auth: false });
  assert.equal(liked.status, 200);

  const after = await api(`/api/movies/${movie.id}`, { auth: false });
  assert.equal(after.payload.data.views, 3);
  assert.equal(after.payload.data.likes, 1);
  assert.ok(after.payload.data.trendingScore > before, 'score should grow with engagement');

  const unliked = await api(`/api/movies/${movie.id}/like`, { method: 'DELETE', auth: false });
  assert.equal(unliked.payload.data.likes, 0);

  await api(`/api/movies/${movie.id}`, { method: 'DELETE' });
});

test('admin stats + meta endpoints expose dashboard data', async () => {
  const stats = await api('/api/admin/stats');
  assert.equal(stats.status, 200);
  assert.ok(stats.payload.data.totalMovies >= 10);

  const meta = await api('/api/meta', { auth: false });
  assert.equal(meta.status, 200);
  assert.ok(meta.payload.data.sorts.some((entry) => entry.value === 'trending'));
  assert.ok(Array.isArray(meta.payload.data.genres));
  assert.equal(meta.payload.data.provider.configured, false);
});

test('external provider endpoints degrade gracefully when no API key is set', async () => {
  const trending = await api('/api/provider/trending', { auth: false });
  assert.equal(trending.status, 503);
  assert.match(trending.payload.error.message, /not configured/i);

  const search = await api('/api/provider/search?q=dune', { auth: false });
  assert.equal(search.status, 503);

  const imported = await api('/api/admin/import', { method: 'POST', body: { externalId: 603 } });
  assert.equal(imported.status, 503);
});

test('unknown routes return the error envelope', async () => {
  const { status, payload } = await api('/api/definitely-not-here', { auth: false });
  assert.equal(status, 404);
  assert.equal(payload.success, false);
  assert.match(payload.error.message, /No route matches/);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

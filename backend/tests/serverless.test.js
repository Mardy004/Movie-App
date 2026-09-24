import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

// --- isolate the test database BEFORE importing the app (mirrors a cold serverless start) ---
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'movieshow-serverless-test-'));
process.env.DB_FILE = path.join(tmpDir, 'db.json');
process.env.NODE_ENV = 'test';
process.env.AUTO_SEED = 'false';
process.env.MOVIE_API_KEY = '';

const appModule = await import('../src/app.js');
const { ROOT_DIR, resolveStoreFile } = await import('../src/config/index.js');

/** Invokes the handler exactly the way Vercel's Express runtime does: app(req, res). */
async function withServer(handler, callback) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('default export is an app instance, not the createApp factory', () => {
  const app = appModule.default;
  assert.notEqual(
    app,
    appModule.createApp,
    'Vercel calls the default export as the request handler - the factory would build an app and never respond',
  );
  assert.equal(typeof app, 'function', 'Express apps are callable request handlers (req, res)');
  assert.equal(typeof app.use, 'function');
  assert.equal(typeof app.listen, 'function');
});

test('default export answers requests without any listen()/bootstrap() step', async () => {
  await withServer(appModule.default, async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.status, 'ok');
  });
});

test('first request passes the store initialisation gate', async () => {
  await withServer(appModule.default, async (base) => {
    // /api/meta needs store.ensure() to have run; the readiness gate must handle it.
    const meta = await fetch(`${base}/api/meta`);
    assert.equal(meta.status, 200);
    const payload = await meta.json();
    assert.ok(Array.isArray(payload.data.genres));
  });
});

test('resolveStoreFile picks a writable location on Vercel', () => {
  // No DB_FILE => the bundled backend/data dir is skipped entirely on Vercel.
  assert.equal(
    resolveStoreFile({ VERCEL: '1' }),
    path.join(os.tmpdir(), 'movieshow-db.json'),
  );
  // A relative DB_FILE override resolves into the writable tmp dir on Vercel...
  assert.equal(
    resolveStoreFile({ VERCEL: '1', DB_FILE: 'data/db.json' }),
    path.join(os.tmpdir(), 'data', 'db.json'),
  );
  // ...but keeps the historic behaviour everywhere else.
  assert.equal(
    resolveStoreFile({ DB_FILE: 'data/db.json' }),
    path.join(ROOT_DIR, 'data', 'db.json'),
  );
  assert.equal(
    resolveStoreFile({}),
    path.join(ROOT_DIR, 'data', 'db.json'),
  );
});

test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

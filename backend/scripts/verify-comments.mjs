const BASE = 'http://localhost:4000';

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

const assert = (label, condition, extra = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}${extra ? ` (${extra})` : ''}`);
  if (!condition) process.exitCode = 1;
};

// 1. pick a movie
const { payload: list } = await call('/api/movies?limit=1');
const movie = list?.data?.[0];
assert('catalogue has movies', Boolean(movie), movie ? movie.title : '');

// 2. empty comment list
const empty = await call(`/api/movies/${movie.id}/comments`);
assert('GET comments works', empty.status === 200 && Array.isArray(empty.payload.data), `count=${empty.payload.data.length}`);

// 3. guest posts a comment
const created = await call(`/api/movies/${movie.id}/comments`, {
  method: 'POST',
  body: JSON.stringify({ name: 'TestFan', email: 'testfan@example.com', body: 'Great movie, loved it!' }),
});
assert('guest can post comment', created.status === 201 && created.payload.data.id, `id=${created.payload?.data?.id || ''}`);

// 4. validation: short name / missing or invalid email rejected
const bad = await call(`/api/movies/${movie.id}/comments`, {
  method: 'POST',
  body: JSON.stringify({ name: 'a', email: 'testfan@example.com', body: 'hi' }),
});
assert('short name rejected (400)', bad.status === 400, bad.payload?.error?.message || '');

const noEmail = await call(`/api/movies/${movie.id}/comments`, {
  method: 'POST',
  body: JSON.stringify({ name: 'TestFan', body: 'no email here' }),
});
assert('missing email rejected (400)', noEmail.status === 400, noEmail.payload?.error?.message || '');

const badEmail = await call(`/api/movies/${movie.id}/comments`, {
  method: 'POST',
  body: JSON.stringify({ name: 'TestFan', email: 'not-an-email', body: 'bad email' }),
});
assert('invalid email rejected (400)', badEmail.status === 400, badEmail.payload?.error?.message || '');

// 5. reply without token rejected
const noAuth = await call(`/api/movies/${movie.id}/comments/${created.payload.data.id}/reply`, {
  method: 'POST',
  body: JSON.stringify({ body: 'nope' }),
});
assert('reply without token rejected (401)', noAuth.status === 401);

// 6. admin login + reply
const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
assert('admin login', login.status === 200 && login.payload.data.token);
const headers = { authorization: `Bearer ${login.payload.data.token}` };

const reply = await call(`/api/movies/${movie.id}/comments/${created.payload.data.id}/reply`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ body: 'Thanks! More like this coming soon.' }),
});
assert('admin reply works', reply.status === 200 && reply.payload.data.reply?.body, reply.payload?.data?.reply?.by || '');

// 7. list shows the reply
const after = await call(`/api/movies/${movie.id}/comments`);
const withReply = after.payload.data.find((entry) => entry.id === created.payload.data.id);
assert('reply persisted in thread', Boolean(withReply?.reply));

// 8. admin delete
const removed = await call(`/api/movies/${movie.id}/comments/${created.payload.data.id}`, { method: 'DELETE', headers });
assert('admin delete comment', removed.status === 200);

// 9. TMDB provider configured + live fetch (401 => shared key was revoked, app still works from the local catalogue)
const providerInfo = await call('/api/admin/provider', { headers });
assert('TMDB configured', providerInfo.payload.data.configured === true);
const trending = await call('/api/provider/trending?limit=3');
if (trending.status === 200 && trending.payload.data.items.length > 0) {
  assert('TMDB live trending fetch', true, trending.payload.data.items.map((item) => item.title).slice(0, 3).join(', '));
} else if (trending.status === 503) {
  console.log(`SKIP - TMDB live fetch unavailable (key/network). App falls back to the local catalogue. Server said: ${trending.payload?.error?.message || ''}`);
} else {
  assert('TMDB live trending fetch', false, `HTTP ${trending.status}`);
}

// 10. admin stats include comment counters
const stats = await call('/api/admin/stats', { headers });
assert('stats include comment counters', typeof stats.payload.data.comments?.total === 'number',
  `total=${stats.payload.data.comments?.total}`);

console.log('DONE');

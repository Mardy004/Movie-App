import http from 'node:http';

const FRONTEND_PORT = 5173;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyText = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: FRONTEND_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyText ? { 'Content-Length': Buffer.byteLength(bodyText) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          try {
            resolve({ status: res.statusCode, json: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      },
    );
    req.on('error', reject);
    if (bodyText) req.write(bodyText);
    req.end();
  });
}

function short(token) {
  return token.slice(0, 24) + '…';
}

async function main() {
  console.log('frontend proxy check: http://localhost:' + FRONTEND_PORT + '/api/...');
  console.log('(proxied to backend http://localhost:4000)');

  const health = await request('GET', '/api/health');
  console.log('GET /api/health', health.status, health.json?.success ? health.json.data.status : health.raw?.slice(0, 80));

  const login = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
  });
  console.log('POST /api/auth/login', login.status, login.json?.success ? 'OK' : login.json?.error?.message);
  if (!login.json?.success) {
    console.log('cannot continue without a valid admin token');
    return;
  }
  const token = login.json.data.token;
  console.log('token:', short(token));

  const stats = await request('GET', '/api/admin/stats', null, token);
  console.log('GET /api/admin/stats', stats.status, stats.json?.success ? 'OK' : stats.json?.error?.message);
  if (stats.json?.success) {
    console.log('  totalMovies:', stats.json.data.totalMovies);
    console.log('  upcoming:', stats.json.data.upcoming);
    console.log('  topTrending count:', stats.json.data.topTrending?.length);
  }

  const created = await request('POST', '/api/movies', {
    title: 'Prova Admin via Proxy',
    tagline: 'End-to-end through the frontend proxy',
    overview: 'Created through the frontend dev proxy to the backend.',
    posterUrl: 'https://picsum.photos/seed/prova-admin-proxy/500/750',
    backdropUrl: 'https://picsum.photos/seed/prova-admin-proxy-bd/1280/720',
    runtimeMinutes: 101,
    rating: 8.7,
    genres: ['Sci-Fi', 'Thriller'],
    language: 'en',
    status: 'released',
  }, token);
  console.log('POST /api/movies', created.status, created.json?.success ? 'OK' : created.json?.error?.message);
  if (!created.json?.success) return;
  const id = created.json.data.id;
  console.log('  id:', id, 'title:', created.json.data.title);

  const readOne = await request('GET', '/api/movies/' + id, null, token);
  console.log('GET /api/movies/:id', readOne.status, readOne.json?.success ? readOne.json.data.title : readOne.json?.error?.message);

  const updated = await request('PATCH', '/api/movies/' + id, {
    rating: 9.0,
    tagline: 'Updated through the frontend proxy',
  }, token);
  console.log('PATCH /api/movies/:id', updated.status, updated.json?.success ? 'OK title=' + updated.json.data.title + ' rating=' + updated.json.data.rating : updated.json?.error?.message);

  const deleted = await request('DELETE', '/api/movies/' + id, null, token);
  console.log('DELETE /api/movies/:id', deleted.status, deleted.json?.success ? 'deleted' : deleted.json?.error?.message);

  const afterDelete = await request('GET', '/api/movies/' + id, null, token);
  console.log('GET /api/movies/:id after delete', afterDelete.status, afterDelete.json?.success ? afterDelete.json.data : afterDelete.json?.error?.message);
}

main().catch((err) => {
  console.error('script failed:', err.message);
  process.exit(1);
});

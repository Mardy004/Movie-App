const BASE = 'http://localhost:4000';
const SAMPLE = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4';

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload, response };
}

const assert = (label, condition, extra = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}${extra ? ` (${extra})` : ''}`);
  if (!condition) process.exitCode = 1;
};

// 1. login + pick a movie
const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
const headers = { authorization: `Bearer ${login.payload.data.token}` };
const { payload: list } = await call('/api/movies?limit=1');
const movie = list.data[0];

// 2. attach a real video file to the movie
const patched = await call(`/api/movies/${movie.id}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ videoUrl: SAMPLE }),
});
assert('admin can set videoUrl', patched.status === 200 && patched.payload.data.videoUrl === SAMPLE);

// 3. watch resolver -> file mode with proxy + download URLs
const watch = await call(`/api/movies/${movie.id}/watch`);
assert('watch resolves file mode', watch.payload.data.mode === 'file', watch.payload.data.src);
assert('watch exposes downloadUrl', watch.payload.data.downloadUrl.endsWith('?download=1'));

// 4. stream: plain GET (metadata)
const head = await fetch(`${BASE}/api/movies/${movie.id}/stream`);
assert('stream proxied 200', head.status === 200, `${head.headers.get('content-type')} ${head.headers.get('content-length') || 'len?'} bytes`);
let streamed = 0;
for await (const chunk of head.body) streamed += chunk.length; // pull the whole body through the proxy
assert('stream returned real bytes', streamed > 100000, `${streamed} bytes streamed through the proxy`);

// 5. stream: Range request (seek support)
const ranged = await fetch(`${BASE}/api/movies/${movie.id}/stream`, { headers: { range: 'bytes=0-1023' } });
assert('range request honored', ranged.status === 206 && (ranged.headers.get('content-range') || '').startsWith('bytes 0-1023/'),
  ranged.headers.get('content-range') || '');

// 6. stream: download mode
const download = await fetch(`${BASE}/api/movies/${movie.id}/stream?download=1`, { headers: { range: 'bytes=0-99' } });
const disposition = download.headers.get('content-disposition') || '';
assert('download sets attachment header', disposition.includes('attachment') && disposition.includes('.mp4'), disposition);

// 7. youtube trailer mode
await call(`/api/movies/${movie.id}`, { method: 'PATCH', headers, body: JSON.stringify({ videoUrl: null, trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }) });
const yt = await call(`/api/movies/${movie.id}/watch`);
assert('youtube trailer mode', yt.payload.data.mode === 'youtube' && yt.payload.data.src.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));

// 8. none mode
await call(`/api/movies/${movie.id}`, { method: 'PATCH', headers, body: JSON.stringify({ trailerUrl: null }) });
const none = await call(`/api/movies/${movie.id}/watch`);
assert('none mode when no sources', none.payload.data.mode === 'none');

// 9. no file -> stream 404
const noFile = await call(`/api/movies/${movie.id}/stream`);
assert('stream without file rejected', noFile.status === 404);

// 10. restore a real file for the demo
await call(`/api/movies/${movie.id}`, { method: 'PATCH', headers, body: JSON.stringify({ videoUrl: SAMPLE }) });
const restored = await call(`/api/movies/${movie.id}/watch`);
assert('video restored for demo', restored.payload.data.mode === 'file');

console.log('DONE');

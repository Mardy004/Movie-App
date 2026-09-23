import * as store from '../store/jsonStore.js';
import { HttpError } from '../utils/http.js';

/**
 * Watch + download layer.
 * - mode "file":    movie.videoUrl points at a real video file (mp4/webm/m3u8).
 *                   /api/movies/:id/stream proxies it with HTTP Range support so
 *                   the <video> player can seek, and ?download=1 adds the
 *                   Content-Disposition attachment header.
 * - mode "youtube": only a trailer exists (TMDB). The UI embeds it instead.
 */

const findMovie = async (movieId) => {
  const db = await store.ensure();
  return db.movies.find((movie) => String(movie.id) === String(movieId));
};

const youtubeId = (url) => {
  const match = String(url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return match ? match[1] : null;
};

/** GET /api/movies/:id/watch - how should the player play this movie? */
export async function resolveWatch(movieId) {
  const movie = await findMovie(movieId);
  if (!movie) throw HttpError.notFound('Movie not found');

  if (movie.videoUrl) {
    return {
      mode: 'file',
      src: `/api/movies/${movie.id}/stream`,
      downloadUrl: `/api/movies/${movie.id}/stream?download=1`,
      filename: `${(movie.title || 'movie').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'movie'}.mp4`,
      kind: String(movie.videoUrl).endsWith('.m3u8') ? 'hls' : 'mp4',
    };
  }
  if (movie.trailerUrl) {
    const id = youtubeId(movie.trailerUrl);
    return {
      mode: id ? 'youtube' : 'file',
      src: id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : movie.trailerUrl,
      downloadUrl: null,
      kind: id ? 'youtube' : 'file',
    };
  }
  return { mode: 'none', src: null, downloadUrl: null, kind: null };
}

/** GET /api/movies/:id/stream - proxies movie.videoUrl (Range + optional download). */
export async function streamMovie(movieId, { rangeHeader, download = false }, reply) {
  const movie = await findMovie(movieId);
  if (!movie) throw HttpError.notFound('Movie not found');
  if (!movie.videoUrl) throw HttpError.notFound('This movie has no video file attached yet');

  let target;
  try {
    target = new URL(movie.videoUrl);
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('bad protocol');
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(target.hostname)) {
      throw new Error('blocked host');
    }
  } catch {
    throw HttpError.badRequest('movie videoUrl is not a reachable http(s) address');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let upstream;
  try {
    upstream = await fetch(target, {
      headers: rangeHeader ? { range: rangeHeader } : {},
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    throw HttpError.serviceUnavailable(`Could not reach the video source: ${error.message}`);
  }
  clearTimeout(timer);

  const headers = {};
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(key);
    if (value) headers[key] = value;
  }
  if (!headers['accept-ranges']) headers['accept-ranges'] = 'bytes';
  if (download) {
    const safeName = `${(movie.title || 'movie').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'movie'}.mp4`;
    headers['content-disposition'] = `attachment; filename="${safeName}"`;
  }

  reply.status(upstream.status);
  for (const [key, value] of Object.entries(headers)) reply.set(key, value);
  const reader = upstream.body.getReader();
  reply.req.on('close', () => reader.cancel().catch(() => {}));
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!reply.write(value)) {
        await new Promise((resolve) => reply.once('drain', resolve));
      }
      if (reply.writableEnded || reply.destroyed) break;
    }
    reply.end();
  } catch {
    /* client disconnected mid-stream - nothing to clean up */
  } finally {
    reader.cancel().catch(() => {});
  }
}

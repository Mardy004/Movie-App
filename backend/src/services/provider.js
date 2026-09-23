import config from '../config/index.js';
import { HttpError } from '../utils/http.js';
import { createMovie, updateMovie } from './movies.service.js';
import * as store from '../store/jsonStore.js';

/**
 * ============================================================================
 *  EXTERNAL MOVIE API ADAPTER  <-- drop your API in here
 * ============================================================================
 * The default implementation speaks the TMDB dialect. To use your own API:
 *   1. backend/.env
 *        MOVIE_API_BASE_URL=https://your-api.example.com/v3
 *        MOVIE_API_KEY=xxxx
 *        MOVIE_API_AUTH_MODE=query | bearer | header
 *        MOVIE_API_IMAGE_BASE=https://cdn.your-api.example.com/images
 *   2. Adjust mapExternalMovie() so its fields match your payload.
 * Nothing else in the app needs to change: the frontend only ever talks to
 * /api/provider/* and /api/movies/*.
 * ============================================================================
 */

const { provider } = config;
const IMAGE_SIZES = { poster: 'w500', backdrop: 'w1280' };

export const isProviderConfigured = () => Boolean(provider.apiKey);

export function providerInfo() {
  return {
    configured: isProviderConfigured(),
    baseUrl: provider.baseUrl,
    authMode: provider.authMode,
    imageBase: provider.imageBase,
    language: provider.language,
    hint: isProviderConfigured()
      ? 'External API configured.'
      : 'Set MOVIE_API_KEY (and MOVIE_API_BASE_URL) in backend/.env to import movies from your own API.',
  };
}

function buildRequest(pathname, params = {}) {
  const url = new URL(`${provider.baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`);
  url.searchParams.set('language', provider.language);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const headers = { accept: 'application/json' };
  if (provider.apiKey) {
    if (provider.authMode === 'bearer') headers.authorization = `Bearer ${provider.apiKey}`;
    else if (provider.authMode === 'header') headers[provider.apiKeyParam] = provider.apiKey;
    else url.searchParams.set(provider.apiKeyParam, provider.apiKey);
  }
  return { url, headers };
}

/** fetch() with timeout + clear error mapping. */
async function request(pathname, params) {
  if (!isProviderConfigured()) {
    throw HttpError.serviceUnavailable(
      'External movie API is not configured yet. Add MOVIE_API_KEY to backend/.env (see docs/API-CONTRACT.md).',
    );
  }
  const { url, headers } = buildRequest(pathname, params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), provider.timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      throw HttpError.serviceUnavailable(`Movie API responded with HTTP ${response.status}`, { url: url.toString() });
    }
    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'AbortError') throw HttpError.serviceUnavailable('Movie API request timed out');
    throw HttpError.serviceUnavailable(`Could not reach the movie API: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

const imageUrl = (path, size) => (path ? `${provider.imageBase}/${IMAGE_SIZES[size] || size}${path}` : null);

const genreNames = (raw) => {
  if (Array.isArray(raw?.genres)) return raw.genres.map((genre) => genre?.name || String(genre)).filter(Boolean);
  if (Array.isArray(raw?.genre_ids)) {
    return raw.genre_ids.map((id) => TMDB_GENRES[id]).filter(Boolean);
  }
  return [];
};

/** TMDB movie genre ids -> human labels (list endpoints only send genre_ids). */
const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/** Maps an external payload to the internal movie model. */
export function mapExternalMovie(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const externalId = raw.id ?? raw.externalId;
  const title = raw.title || raw.name || raw.original_title || raw.original_name;
  if (externalId === undefined || externalId === null || !title) return null;

  const releaseDate = raw.release_date || raw.released || raw.first_air_date || null;
  const releaseTime = releaseDate ? new Date(releaseDate).getTime() : NaN;
  // List endpoints do not carry a "status" field - a future release date means upcoming.
  const status = Number.isFinite(releaseTime) && releaseTime > Date.now() ? 'upcoming' : 'released';

  return {
    externalId: String(externalId),
    title: String(title),
    tagline: raw.tagline || null,
    overview: raw.overview || raw.description || null,
    posterUrl: raw.posterUrl || imageUrl(raw.poster_path, 'poster'),
    backdropUrl: raw.backdropUrl || imageUrl(raw.backdrop_path, 'backdrop'),
    trailerUrl: raw.trailerUrl || null,
    releaseDate,
    runtimeMinutes: Number(raw.runtime || raw.episode_run_time?.[0] || 0) || 0,
    genres: genreNames(raw),
    cast: Array.isArray(raw.cast)
      ? raw.cast.map((person) => (typeof person === 'string' ? person : person?.name)).filter(Boolean)
      : [],
    rating: Math.round(Number(raw.vote_average ?? raw.rating ?? 0) * 10) / 10,
    popularity: Math.round(Number(raw.popularity ?? 0) * 100) / 100,
    language: raw.original_language || raw.language || 'en',
    status,
    source: 'external',
  };
}

const unwrap = (payload) => payload?.results ?? payload?.data ?? (Array.isArray(payload) ? payload : []);


/** GET /api/provider/trending - live trending list, not persisted. */
export async function fetchTrending({ page = 1, limit = 12 } = {}) {
  const payload = await request('/trending/movie/week', { page });
  const rows = unwrap(payload);
  return { items: rows.slice(0, limit).map(mapExternalMovie).filter(Boolean), total: rows.length, page };
}

/** GET /api/provider/search?q= - live search, not persisted. */
export async function searchExternal(query, { page = 1, limit = 12 } = {}) {
  if (!query) throw HttpError.badRequest('A search query "q" is required');
  const payload = await request('/search/movie', { query, page, include_adult: false });
  const rows = unwrap(payload);
  return { items: rows.slice(0, limit).map(mapExternalMovie).filter(Boolean), total: rows.length, page, query };
}

/** TMDB list endpoints exposed to the public UI (Amazon-style browse categories). */
const LIST_ENDPOINTS = {
  popular: '/movie/popular',
  'top-rated': '/movie/top_rated',
  upcoming: '/movie/upcoming',
  'now-playing': '/movie/now_playing',
};

/** GET /api/provider/:kind (popular | top-rated | upcoming | now-playing) - live. */
export async function fetchProviderList(kind, { page = 1, limit = 20 } = {}) {
  const endpoint = LIST_ENDPOINTS[kind];
  if (!endpoint) throw HttpError.badRequest(`Unknown provider list "${kind}"`);
  const payload = await request(endpoint, { page });
  const rows = unwrap(payload);
  return { items: rows.slice(0, limit).map(mapExternalMovie).filter(Boolean), total: rows.length, page, kind };
}

/**
 * GET /api/provider/detail/:externalId - rich single-title payload.
 * The detail response carries the full genre list, runtime, tagline, cast
 * (via the credits append) and official videos, so the movie screen can be
 * rendered straight from TMDB without importing the title first.
 */
export async function fetchProviderDetail(externalId) {
  const payload = await request(`/movie/${encodeURIComponent(externalId)}`, {
    append_to_response: 'credits,videos',
  });
  const cast = (payload?.credits?.cast || [])
    .slice(0, 12)
    .map((person) => person?.name)
    .filter(Boolean);
  const trailer = (payload?.videos?.results || []).find(
    (video) => video?.site === 'YouTube' && video?.type === 'Trailer',
  );
  const mapped = mapExternalMovie({
    ...payload,
    cast,
    trailerUrl: trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
  });
  if (!mapped) throw HttpError.serviceUnavailable('External payload could not be mapped to a movie');
  return { ...mapped, voteCount: Number(payload?.vote_count || 0), homepage: payload?.homepage || null };
}

/** GET /api/provider/id/:externalId - full external detail, not persisted. */
export async function fetchExternalMovie(externalId) {
  const payload = await request(`/movie/${encodeURIComponent(externalId)}`);
  const mapped = mapExternalMovie(payload);
  if (!mapped) throw HttpError.serviceUnavailable('External payload could not be mapped to a movie');
  return mapped;
}

/**
 * Picks the best YouTube trailer for an external id (official > teaser > any).
 * Returns a plain https://www.youtube.com/watch?v=… URL or null.
 */
export async function fetchExternalTrailer(externalId) {
  try {
    const payload = await request(`/movie/${encodeURIComponent(externalId)}/videos`, { include_video_language: 'en,null' });
    const rows = unwrap(payload);
    const pick = rows.find((video) => video?.site === 'YouTube' && video?.type === 'Trailer' && video?.official)
      || rows.find((video) => video?.site === 'YouTube' && video?.type === 'Trailer')
      || rows.find((video) => video?.site === 'YouTube' && video?.type === 'Teaser');
    return pick?.key ? `https://www.youtube.com/watch?v=${pick.key}` : null;
  } catch {
    return null; // trailers are a bonus - never block the import
  }
}

const findLocalByExternalId = async (externalId) => {
  const db = await store.ensure();
  return db.movies.find((movie) => movie.externalId === String(externalId)) || null;
};

/**
 * Admin import: copies an external id into the local catalogue.
 * Upserts by externalId so re-importing refreshes instead of duplicating.
 */
export async function importFromProvider(externalId, { refresh = false } = {}) {
  const mapped = await fetchExternalMovie(externalId);
  if (!mapped.trailerUrl) mapped.trailerUrl = await fetchExternalTrailer(externalId);
  const existing = await findLocalByExternalId(externalId);
  if (existing && !refresh) {
    const { getMovie } = await import('./movies.service.js');
    return { action: 'skipped', movie: await getMovie(existing.id), reason: 'Already in the catalogue' };
  }
  const movie = existing ? await updateMovie(existing.id, mapped) : await createMovie(mapped, { source: 'external' });
  await store.mutate((db) => {
    db.meta.lastImportAt = new Date().toISOString();
  });
  return { action: existing ? 'updated' : 'created', movie };
}

/** Bulk import: first N trending titles from the external API. */
export async function importTrending({ limit = 5, refresh = false } = {}) {
  const { items } = await fetchTrending({ limit });
  const results = [];
  for (const item of items) {
    try {
      results.push({ externalId: item.externalId, title: item.title, ...(await importFromProvider(item.externalId, { refresh })) });
    } catch (error) {
      results.push({ externalId: item.externalId, title: item.title, action: 'failed', error: error.message });
    }
  }
  return {
    requested: limit,
    created: results.filter((entry) => entry.action === 'created').length,
    updated: results.filter((entry) => entry.action === 'updated').length,
    skipped: results.filter((entry) => entry.action === 'skipped').length,
    failed: results.filter((entry) => entry.action === 'failed').length,
    results,
  };
}

export default {
  isProviderConfigured,
  providerInfo,
  mapExternalMovie,
  fetchTrending,
  searchExternal,
  fetchProviderList,
  fetchProviderDetail,
  fetchExternalMovie,
  fetchExternalTrailer,
  importFromProvider,
  importTrending,
};

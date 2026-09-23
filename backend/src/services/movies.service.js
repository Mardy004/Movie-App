import * as store from '../store/jsonStore.js';
import { HttpError } from '../utils/http.js';
import { buildMovie, normalizeMovie } from '../models/movie.js';
import { decorate, trendingScore } from './trending.js';
import { seedMovies } from '../data/seedMovies.js';

export const SORT_OPTIONS = {
  trending: 'Trending now',
  'recently-added': 'Recently added',
  recent: 'Newest releases',
  rating: 'Top rated',
  views: 'Most watched',
  title: 'A - Z',
};

const byDateDesc = (a, b, field) => String(b[field] || '').localeCompare(String(a[field] || ''));

const comparators = {
  trending: (now) => (a, b) => trendingScore(b, now) - trendingScore(a, now) || byDateDesc(a, b, 'createdAt'),
  'recently-added': () => (a, b) => byDateDesc(a, b, 'createdAt'),
  recent: () => (a, b) => byDateDesc(a, b, 'releaseDate') || byDateDesc(a, b, 'createdAt'),
  rating: () => (a, b) => (b.rating || 0) - (a.rating || 0),
  views: () => (a, b) => (b.views || 0) - (a.views || 0),
  title: () => (a, b) => String(a.title).localeCompare(String(b.title)),
};

const matchesQuery = (movie, needle) => {
  if (!needle) return true;
  const haystack = [movie.title, movie.tagline, movie.overview, (movie.genres || []).join(' '), (movie.cast || []).join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
};

/**
 * Lists movies with filtering, sorting and pagination.
 * sort: trending | recently-added | recent | rating | views | title
 */
export async function listMovies(query = {}) {
  const db = await store.ensure();
  const now = new Date();
  const sortKey = SORT_OPTIONS[query.sort] ? query.sort : 'trending';
  const limit = Math.min(Math.max(Number(query.limit) || 24, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const genre = query.genre ? String(query.genre).toLowerCase() : null;
  const status = query.status ? String(query.status).toLowerCase() : null;
  const includeArchived = String(query.includeArchived ?? 'true') !== 'false';

  let items = db.movies.slice();
  if (!includeArchived) items = items.filter((movie) => movie.status !== 'archived');
  if (genre) items = items.filter((movie) => (movie.genres || []).some((entry) => entry.toLowerCase() === genre));
  if (status) items = items.filter((movie) => movie.status === status);
  if (query.minRating) items = items.filter((movie) => (movie.rating || 0) >= Number(query.minRating));
  if (query.q) items = items.filter((movie) => matchesQuery(movie, String(query.q).trim()));

  const total = items.length;
  items.sort(comparators[sortKey](now));

  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit).map((movie) => decorate(movie, now));

  return {
    items: paged,
    meta: {
      sort: sortKey,
      sortLabel: SORT_OPTIONS[sortKey],
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: start + limit < total,
    },
  };
}

const findIndex = (db, id) => db.movies.findIndex((movie) => movie.id === id || movie.externalId === id);

export async function createMovie(payload, { source = 'local' } = {}) {
  const input = normalizeMovie(payload, { partial: false });
  const movie = buildMovie({ ...input, source });
  await store.mutate((db) => {
    db.movies.push(movie);
  });
  return decorate(movie);
}

export async function updateMovie(id, payload) {
  const input = normalizeMovie(payload, { partial: true });
  const updated = await store.mutate((db) => {
    const index = findIndex(db, id);
    if (index === -1) throw HttpError.notFound(`Movie "${id}" was not found`);
    const next = { ...db.movies[index], ...input, updatedAt: new Date().toISOString() };
    db.movies[index] = next;
    return next;
  });
  return decorate(updated);
}

export async function deleteMovie(id) {
  return store.mutate((db) => {
    const index = findIndex(db, id);
    if (index === -1) throw HttpError.notFound(`Movie "${id}" was not found`);
    const [removed] = db.movies.splice(index, 1);
    return removed;
  });
}

/** Public engagement - also feeds the trending score. */
export async function registerView(id) {
  const updated = await store.mutate((db) => {
    const index = findIndex(db, id);
    if (index === -1) throw HttpError.notFound(`Movie "${id}" was not found`);
    const movie = db.movies[index];
    movie.views = (movie.views || 0) + 1;
    movie.popularity = Math.round(((movie.popularity || 0) + 0.35) * 100) / 100;
    db.movies[index] = movie;
    return movie;
  });
  return decorate(updated);
}

/** delta: 1 => like, -1 => unlike (likes never drop below zero). */
export async function likeMovie(id, delta = 1) {
  const step = delta < 0 ? -1 : 1;
  const updated = await store.mutate((db) => {
    const index = findIndex(db, id);
    if (index === -1) throw HttpError.notFound(`Movie "${id}" was not found`);
    const movie = db.movies[index];
    movie.likes = Math.max(0, (movie.likes || 0) + step);
    movie.popularity = Math.round(Math.max(0, (movie.popularity || 0) + step * 0.2) * 100) / 100;
    db.movies[index] = movie;
    return movie;
  });
  return decorate(updated);
}

export async function listGenres() {
  const db = await store.ensure();
  const counts = new Map();
  for (const movie of db.movies) {
    for (const genre of movie.genres || []) {
      counts.set(genre, (counts.get(genre) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, slug: name.toLowerCase().replace(/\s+/g, '-') }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function stats() {
  const db = await store.ensure();
  const now = new Date();
  const movies = db.movies;
  const ranked = movies.slice().sort((a, b) => trendingScore(b, now) - trendingScore(a, now));
  return {
    totalMovies: movies.length,
    totalViews: movies.reduce((sum, movie) => sum + (movie.views || 0), 0),
    totalLikes: movies.reduce((sum, movie) => sum + (movie.likes || 0), 0),
    upcoming: movies.filter((movie) => movie.status === 'upcoming').length,
    archived: movies.filter((movie) => movie.status === 'archived').length,
    addedLast7Days: movies.filter((movie) => (now - Date.parse(movie.createdAt)) / 86400000 <= 7).length,
    averageRating: movies.length
      ? Math.round((movies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / movies.length) * 100) / 100
      : 0,
    topTrending: ranked.slice(0, 5).map((movie) => ({ id: movie.id, title: movie.title, score: trendingScore(movie, now) })),
    lastImportAt: db.meta?.lastImportAt || null,
    seededAt: db.meta?.seededAt || null,
  };
}

/** Restores the demo catalogue (used by `npm run seed` and the admin "reset" action). */
export async function seedDatabase({ force = false } = {}) {
  const db = await store.ensure();
  if (db.movies.length && !force) {
    return { seeded: false, reason: 'Database already contains movies - pass force=true to overwrite', count: db.movies.length };
  }
  const now = new Date().toISOString();
  const movies = seedMovies.map((movie) => buildMovie({ ...movie, source: 'seed' }, new Date(movie.createdAt || now)));
  await store.replaceAll(movies, { seededAt: now, lastImportAt: null });
  return { seeded: true, count: movies.length };
}

export default {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  registerView,
  likeMovie,
  listGenres,
  stats,
  seedDatabase,
  SORT_OPTIONS,
};


export async function getMovie(id) {
  const db = await store.ensure();
  const index = findIndex(db, id);
  if (index === -1) throw HttpError.notFound(`Movie "${id}" was not found`);
  return decorate(db.movies[index]);
}

import crypto from 'node:crypto';
import { HttpError } from '../utils/http.js';

export const MOVIE_STATUSES = ['released', 'upcoming', 'archived'];

const GENRE_MAX = 8;
const CAST_MAX = 12;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const toNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

/** Turns "a, b , c" / ["a","b"] into a clean, de-duplicated array. */
export function toList(value, { limit = GENRE_MAX } = {}) {
  if (value === null || value === undefined) return [];
  const raw = Array.isArray(value) ? value : String(value).split(/[,|]/);
  const seen = new Set();
  const out = [];
  for (const entry of raw) {
    const label = String(entry).trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= limit) break;
  }
  return out;
}

function toIsoDate(value, field) {
  if (isBlank(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw HttpError.badRequest(`${field} must be a valid date (YYYY-MM-DD)`);
  return parsed.toISOString().slice(0, 10);
}

function toUrl(value, field) {
  if (isBlank(value)) return null;
  const url = String(value).trim();
  if (!/^(https?:)?\/\//i.test(url) && !url.startsWith('data:')) {
    throw HttpError.badRequest(`${field} must be an absolute http(s) URL`);
  }
  return url;
}

function toRating(value) {
  if (isBlank(value)) return 0;
  const rating = toNumber(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    throw HttpError.badRequest('rating must be a number between 0 and 10');
  }
  return Math.round(rating * 10) / 10;
}

function toCount(value, field, min = 0) {
  if (isBlank(value)) return min;
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw HttpError.badRequest(`${field} must be a number >= ${min}`);
  }
  return Math.floor(parsed);
}

/** Wraps a normaliser so field errors are collected instead of thrown immediately. */
const collect = (errors, fn) => {
  try {
    return fn();
  } catch (error) {
    errors.push(error.message);
    return undefined;
  }
};


/**
 * Validates and normalises an incoming movie payload.
 * `partial: true` (PATCH style) only touches supplied keys.
 */
export function normalizeMovie(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw HttpError.badRequest('A JSON object body is required');
  const errors = [];
  const out = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('title')) {
    if (isBlank(body.title)) errors.push('title is required');
    else if (String(body.title).trim().length < 2) errors.push('title must be at least 2 characters');
    else out.title = String(body.title).trim().slice(0, 180);
  }

  out.tagline = (!partial || has('tagline')) ? (isBlank(body.tagline) ? null : String(body.tagline).trim().slice(0, 240)) : null;
  out.overview = (!partial || has('overview')) ? (isBlank(body.overview) ? null : String(body.overview).trim().slice(0, 4000)) : null;
  out.posterUrl = (!partial || has('posterUrl')) ? (collect(errors, () => toUrl(body.posterUrl, 'posterUrl')) ?? null) : null;
  out.backdropUrl = (!partial || has('backdropUrl')) ? (collect(errors, () => toUrl(body.backdropUrl, 'backdropUrl')) ?? null) : null;
  out.trailerUrl = (!partial || has('trailerUrl')) ? (collect(errors, () => toUrl(body.trailerUrl, 'trailerUrl')) ?? null) : null;
  out.videoUrl = (!partial || has('videoUrl')) ? (collect(errors, () => toUrl(body.videoUrl, 'videoUrl')) ?? null) : null;

  out.releaseDate = (!partial || has('releaseDate')) ? (collect(errors, () => toIsoDate(body.releaseDate, 'releaseDate')) ?? null) : null;
  out.rating = (!partial || has('rating')) ? (collect(errors, () => toRating(body.rating)) ?? 0) : 0;
  out.runtimeMinutes = (!partial || has('runtimeMinutes')) ? (collect(errors, () => toCount(body.runtimeMinutes, 'runtimeMinutes')) ?? 0) : 0;
  out.popularity = (!partial || has('popularity')) ? (collect(errors, () => toCount(body.popularity, 'popularity')) ?? 0) : 0;
  out.views = (!partial || has('views')) ? (collect(errors, () => toCount(body.views, 'views')) ?? 0) : 0;
  out.likes = (!partial || has('likes')) ? (collect(errors, () => toCount(body.likes, 'likes')) ?? 0) : 0;

  out.genres = (!partial || has('genres')) ? toList(body.genres) : [];
  out.cast = (!partial || has('cast')) ? toList(body.cast, { limit: CAST_MAX }) : [];
  out.language = (!partial || has('language')) ? (isBlank(body.language) ? 'en' : String(body.language).trim().slice(0, 12)) : 'en';
  out.externalId = (!partial || has('externalId')) ? (isBlank(body.externalId) ? null : String(body.externalId).trim().slice(0, 64)) : null;

  if (!partial || has('status')) {
    const status = isBlank(body.status) ? 'released' : String(body.status).trim().toLowerCase();
    if (!MOVIE_STATUSES.includes(status)) errors.push(`status must be one of: ${MOVIE_STATUSES.join(', ')}`);
    else out.status = status;
  } else {
    out.status = 'released';
  }

  if (errors.length) throw HttpError.badRequest('Movie validation failed', errors);
  if (partial && !Object.keys(out).length) throw HttpError.badRequest('No updatable fields were provided');
  return out;
}

/** Creates the final stored record (adds id + timestamps). */
export function buildMovie(input, now = new Date()) {
  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    externalId: input.externalId || null,
    title: input.title,
    tagline: input.tagline ?? null,
    overview: input.overview ?? null,
    posterUrl: input.posterUrl ?? null,
    backdropUrl: input.backdropUrl ?? null,
    trailerUrl: input.trailerUrl ?? null,
    videoUrl: input.videoUrl ?? null,
    releaseDate: input.releaseDate ?? null,
    runtimeMinutes: input.runtimeMinutes ?? 0,
    genres: input.genres ?? [],
    cast: input.cast ?? [],
    rating: input.rating ?? 0,
    popularity: input.popularity ?? 0,
    views: input.views ?? 0,
    likes: input.likes ?? 0,
    language: input.language || 'en',
    status: input.status || 'released',
    source: input.source || 'local',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export default { normalizeMovie, buildMovie, toList, MOVIE_STATUSES };

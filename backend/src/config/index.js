import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Project root = <repo>/backend */
export const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Load backend/.env when present (process.loadEnvFile exists on Node >= 20.12).
const envFile = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    /* ignore malformed .env, defaults still apply */
  }
}

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value, fallback) =>
  (value ? String(value).split(',') : fallback).map((entry) => entry.trim()).filter(Boolean);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 4000),
  corsOrigins: list(process.env.CORS_ORIGIN, ['*']),

  /** Where the JSON database lives. Override with DB_FILE (used by the tests). */
  storeFile: process.env.DB_FILE
    ? path.resolve(ROOT_DIR, process.env.DB_FILE)
    : path.join(ROOT_DIR, 'data', 'db.json'),
  seedFile: null, // demo catalogue lives in src/data/seedMovies.js

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    displayName: process.env.ADMIN_NAME || 'Studio Admin',
    email: process.env.ADMIN_EMAIL || 'admin@movieshow.app',
  },

  auth: {
    secret: process.env.AUTH_SECRET || 'dev-only-secret-change-me',
    ttlSeconds: num(process.env.AUTH_TTL_SECONDS, 60 * 60 * 12),
  },

  /**
   * External movie API ("i will share API where movie will be from").
   * Defaults speak the TMDB dialect; point MOVIE_API_BASE_URL at your own API and
   * adjust field mapping in src/services/provider.js if the payload differs.
   */
  provider: {
    baseUrl: (process.env.MOVIE_API_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, ''),
    apiKey: process.env.MOVIE_API_KEY || '',
    /** query | bearer | header */
    authMode: (process.env.MOVIE_API_AUTH_MODE || 'query').toLowerCase(),
    apiKeyParam: process.env.MOVIE_API_KEY_PARAM || 'api_key',
    imageBase: (process.env.MOVIE_API_IMAGE_BASE || 'https://image.tmdb.org/t/p').replace(/\/+$/, ''),
    language: process.env.MOVIE_API_LANGUAGE || 'en-US',
    timeoutMs: num(process.env.MOVIE_API_TIMEOUT_MS, 10000),
  },

  trending: {
    halfLifeDays: num(process.env.TRENDING_HALF_LIFE_DAYS, 30),
    viewWeight: num(process.env.TRENDING_VIEW_WEIGHT, 0.35),
    likeWeight: num(process.env.TRENDING_LIKE_WEIGHT, 2.5),
    popularityWeight: num(process.env.TRENDING_POPULARITY_WEIGHT, 1.6),
    ratingWeight: num(process.env.TRENDING_RATING_WEIGHT, 0.8),
    /** Added within N days => "recently added" badge + freshness boost. */
    freshWindowDays: num(process.env.TRENDING_FRESH_DAYS, 14),
  },
};

export default config;

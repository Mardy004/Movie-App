import config from '../config/index.js';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Age of a record in days (never negative). */
export function ageInDays(isoDate, now = new Date()) {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, (now.getTime() - timestamp) / MS_PER_DAY);
}

/**
 * Trending score = weighted engagement, damped by age (half-life decay) and
 * boosted while a title is still "fresh" (recently added to the catalogue).
 *
 *   engagement = views*Wv + likes*Wl + popularity*Wp + rating*Wr
 *   decay      = 0.55 + 0.45 * 0.5^(ageDays / halfLife)
 *   freshness  = up to +35% while ageDays <= freshWindowDays
 */
export function trendingScore(movie, now = new Date()) {
  const weights = config.trending;
  const ageDays = ageInDays(movie.createdAt, now);
  const halfLife = Math.max(1, weights.halfLifeDays);
  const decay = 0.55 + 0.45 * Math.pow(0.5, ageDays / halfLife);
  const window = Math.max(1, weights.freshWindowDays);
  const freshness = ageDays <= window ? 1 + 0.35 * ((window - ageDays) / window) : 1;

  const engagement =
    (movie.views || 0) * weights.viewWeight +
    (movie.likes || 0) * weights.likeWeight +
    (movie.popularity || 0) * weights.popularityWeight +
    (movie.rating || 0) * weights.ratingWeight;

  return Math.round(engagement * decay * freshness * 1000) / 1000;
}

/** Adds derived, read-only fields used by the UI (never persisted). */
export function decorate(movie, now = new Date()) {
  const ageDays = ageInDays(movie.createdAt, now);
  return {
    ...movie,
    trendingScore: trendingScore(movie, now),
    ageInDays: Math.round(ageDays * 100) / 100,
    isFresh: ageDays <= config.trending.freshWindowDays,
    releaseYear: movie.releaseDate ? Number(String(movie.releaseDate).slice(0, 4)) : null,
    isUpcoming: movie.status === 'upcoming' || (!!movie.releaseDate && Date.parse(movie.releaseDate) > now.getTime()),
  };
}

export default { trendingScore, decorate, ageInDays, MS_PER_DAY };

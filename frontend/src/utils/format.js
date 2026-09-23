/** Small formatting helpers shared by the UI (kept dependency-free). */

export const formatRuntime = (minutes) => {
  const total = Number(minutes) || 0;
  if (!total) return '—';
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const formatDate = (value, { withYear = true } = {}) => {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBA';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
};

export const compactNumber = (value) => {
  const number = Number(value) || 0;
  if (number < 1000) return String(number);
  if (number < 1_000_000) return `${(number / 1000).toFixed(number < 10_000 ? 1 : 0)}k`;
  return `${(number / 1_000_000).toFixed(1)}M`;
};

export const timeAgo = (value) => {
  if (!value) return 'unknown';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 31) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
};

export const initials = (title = '') =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || 'MS';

/** Deterministic gradient for poster fallbacks - drawn from the Nocturne palette. */
const FALLBACK_GRADIENTS = [
  ['#7C5CFF', '#0A1024'],
  ['#22A9F0', '#111834'],
  ['#FF4D7D', '#1A2246'],
  ['#16C79A', '#0A1024'],
  ['#FFA91D', '#1A2246'],
  ['#9B87FF', '#050817'],
];

export const gradientFor = (seed = '') => {
  const key = String(seed);
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000;
  }
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];
};

export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const sortLabels = {
  trending: 'Trending now',
  'recently-added': 'Recently added',
  recent: 'Newest releases',
  rating: 'Top rated',
  views: 'Most watched',
  title: 'A - Z',
};

/** Converts a movie record into the payload the admin form submits. */
export const toFormValues = (movie = {}) => ({
  title: movie.title || '',
  tagline: movie.tagline || '',
  overview: movie.overview || '',
  posterUrl: movie.posterUrl || '',
  backdropUrl: movie.backdropUrl || '',
  trailerUrl: movie.trailerUrl || '',
  videoUrl: movie.videoUrl || '',
  releaseDate: movie.releaseDate || '',
  runtimeMinutes: movie.runtimeMinutes ?? 0,
  genres: (movie.genres || []).join(', '),
  cast: (movie.cast || []).join(', '),
  rating: movie.rating ?? 0,
  popularity: movie.popularity ?? 0,
  language: movie.language || 'en',
  status: movie.status || 'released',
  externalId: movie.externalId || '',
});

export const emptyFormValues = () =>
  toFormValues({ status: 'released', language: 'en', rating: 0, popularity: 0, runtimeMinutes: 0 });

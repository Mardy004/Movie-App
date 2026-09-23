import fsp from 'node:fs/promises';
import path from 'node:path';
import config from '../config/index.js';

/**
 * Tiny atomic JSON store.
 * - whole DB is kept in memory (fine for thousands of movies),
 * - every mutation is serialised through a promise queue so concurrent
 *   requests can never interleave read/modify/write cycles,
 * - writes go to a temp file first, then rename (no half-written db.json).
 */
const emptyDb = () => ({
  movies: [],
  comments: [],
  meta: { seededAt: null, lastImportAt: null, version: 1 },
});

let state = null;
let queue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

async function persist() {
  const file = config.storeFile;
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fsp.rename(tmp, file);
}

/** Loads the DB from disk once (idempotent). */
export async function ensure() {
  if (state) return state;
  try {
    const raw = await fsp.readFile(config.storeFile, 'utf8');
    const parsed = JSON.parse(raw);
    state = { ...emptyDb(), ...parsed };
    if (!Array.isArray(state.movies)) state.movies = [];
    if (!Array.isArray(state.comments)) state.comments = [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = emptyDb();
    await persist();
  }
  return state;
}

/** Direct (read-only) access to the in-memory db. */
export function read() {
  if (!state) throw new Error('Store not initialised - call await store.ensure() first');
  return state;
}

/** Serialised read-modify-write. `fn` may be async and its result is returned. */
export function mutate(fn) {
  const run = async () => {
    const db = await ensure();
    const result = await fn(db);
    await persist();
    return result;
  };
  const next = queue.then(run, run);
  queue = next.then(() => undefined, () => undefined);
  return next;
}

export async function replaceAll(movies, meta = {}) {
  return mutate((db) => {
    db.movies = clone(movies);
    db.meta = { ...db.meta, ...meta };
    return db.movies.length;
  });
}

export async function reset() {
  return mutate((db) => {
    db.movies = [];
    db.meta = { ...emptyDb().meta };
  });
}

export const emptySnapshot = emptyDb;

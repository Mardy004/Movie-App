import crypto from 'node:crypto';
import { HttpError } from '../utils/http.js';
import * as store from '../store/jsonStore.js';

/**
 * Comment threads per movie - guests post with a display name + email.
 * The signed-in admin replies inline and can delete anything. Threads live
 * in the same atomic JSON store as movies.
 */
const NAME_MIN = 2;
const NAME_MAX = 40;
const BODY_MAX = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;

const clone = (value) => JSON.parse(JSON.stringify(value));

const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const toPublic = (comment) => clone(comment);

const makeComment = (movieId, name, email, body) => ({
  id: crypto.randomUUID(),
  movieId: String(movieId),
  name: cleanText(name),
  email: cleanText(email).toLowerCase(),
  body: cleanText(body),
  isAdmin: false,
  createdAt: new Date().toISOString(),
  reply: null, // { body, createdAt } set when the admin answers
});

const findMovie = (db, movieId) => db.movies.find((movie) => String(movie.id) === String(movieId));

export async function listByMovie(movieId) {
  const db = await store.ensure();
  return db.comments
    .filter((comment) => comment.movieId === String(movieId))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(toPublic);
}

export async function addComment(movieId, { name, email, body }) {
  const displayName = cleanText(name);
  const senderEmail = cleanText(email).toLowerCase();
  const message = cleanText(body);
  if (displayName.length < NAME_MIN || displayName.length > NAME_MAX) {
    throw HttpError.badRequest(`Name must be between ${NAME_MIN} and ${NAME_MAX} characters`, ['name']);
  }
  if (!senderEmail) throw HttpError.badRequest('An email address is required', ['email']);
  if (senderEmail.length > EMAIL_MAX) throw HttpError.badRequest(`Email must be at most ${EMAIL_MAX} characters`, ['email']);
  if (!EMAIL_RE.test(senderEmail)) throw HttpError.badRequest('A valid email address is required', ['email']);
  if (!message) throw HttpError.badRequest('A comment is required', ['body']);
  if (message.length > BODY_MAX) throw HttpError.badRequest(`Comment must be at most ${BODY_MAX} characters`, ['body']);

  return store.mutate(async (db) => {
    if (!findMovie(db, movieId)) throw HttpError.notFound('Movie not found');
    const comment = makeComment(movieId, displayName, senderEmail, message);
    db.comments.push(comment);
    return toPublic(comment);
  });
}

export async function addAdminReply(movieId, commentId, { body }, user) {
  const message = cleanText(body);
  if (!message) throw HttpError.badRequest('A reply is required', ['body']);
  if (message.length > BODY_MAX) throw HttpError.badRequest(`Reply must be at most ${BODY_MAX} characters`, ['body']);

  return store.mutate(async (db) => {
    if (!findMovie(db, movieId)) throw HttpError.notFound('Movie not found');
    const comment = db.comments.find((entry) => entry.id === String(commentId) && entry.movieId === String(movieId));
    if (!comment) throw HttpError.notFound('Comment not found');
    comment.reply = {
      body: message,
      createdAt: new Date().toISOString(),
      by: user?.displayName || user?.username || 'Studio Admin',
    };
    return toPublic(comment);
  });
}

export async function removeComment(movieId, commentId) {
  return store.mutate(async (db) => {
    const before = db.comments.length;
    db.comments = db.comments.filter(
      (entry) => !(entry.id === String(commentId) && entry.movieId === String(movieId)),
    );
    if (db.comments.length === before) throw HttpError.notFound('Comment not found');
    return { id: String(commentId), deleted: true };
  });
}

export async function adminStats() {
  const db = await store.ensure();
  return {
    total: db.comments.length,
    awaitingReply: db.comments.filter((comment) => !comment.reply).length,
  };
}

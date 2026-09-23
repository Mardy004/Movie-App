/**
 * Admin session kept in memory only - the admin signs in again on every
 * visit / refresh. Nothing auth-related touches localStorage.
 */
export const session = {
  token: '',
  user: null,
  getToken: () => session.token,
  getUser: () => session.user,
  save: (token, user) => {
    session.token = token || '';
    session.user = user || null;
  },
  clear: () => {
    session.token = '';
    session.user = null;
  },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || [];
  }
}

const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

/**
 * API origin override for production deploys (e.g. Vercel frontend + backend on
 * another host). Empty by default so the dev proxy keeps working unchanged.
 */
export const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function request(pathname, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const token = session.getToken();
  if (auth && token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}/api${pathname}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the API server. Is the backend running?', 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }
  return payload;
}

const unwrapList = (payload) => ({ items: payload.data || [], meta: payload.meta || {} });

export const api = {
  health: () => request('/health').then((payload) => payload.data),
  meta: () => request('/meta').then((payload) => payload.data),

  movies: {
    list: (params = {}, options = {}) => request(`/movies${qs(params)}`, options).then(unwrapList),
    get: (id, options = {}) => request(`/movies/${encodeURIComponent(id)}`, options).then((payload) => payload.data),
    genres: () => request('/movies/genres').then((payload) => payload.data),
    create: (movie) => request('/movies', { method: 'POST', body: movie, auth: true }).then((payload) => payload.data),
    update: (id, patch) =>
      request(`/movies/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, auth: true }).then((payload) => payload.data),
    remove: (id) => request(`/movies/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }).then((payload) => payload.data),
    view: (id) => request(`/movies/${encodeURIComponent(id)}/view`, { method: 'POST' }).then((payload) => payload.data),
    like: (id) => request(`/movies/${encodeURIComponent(id)}/like`, { method: 'POST' }).then((payload) => payload.data),
    unlike: (id) => request(`/movies/${encodeURIComponent(id)}/like`, { method: 'DELETE' }).then((payload) => payload.data),
    watch: (id, options = {}) =>
      request(`/movies/${encodeURIComponent(id)}/watch`, options).then((payload) => payload.data),
    streamUrl: (id, { download = false } = {}) =>
      `${API_BASE}/api/movies/${encodeURIComponent(id)}/stream${download ? '?download=1' : ''}`,
  },

  comments: {
    list: (movieId, options = {}) =>
      request(`/movies/${encodeURIComponent(movieId)}/comments`, options).then((payload) => payload.data),
    add: (movieId, { name, email, body }) =>
      request(`/movies/${encodeURIComponent(movieId)}/comments`, { method: 'POST', body: { name, email, body } }).then(
        (payload) => payload.data,
      ),
    reply: (movieId, commentId, body) =>
      request(`/movies/${encodeURIComponent(movieId)}/comments/${encodeURIComponent(commentId)}/reply`, {
        method: 'POST',
        body: { body },
        auth: true,
      }).then((payload) => payload.data),
    remove: (movieId, commentId) =>
      request(
        `/movies/${encodeURIComponent(movieId)}/comments/${encodeURIComponent(commentId)}`,
        { method: 'DELETE', auth: true },
      ).then((payload) => payload.data),
  },

  auth: {
    login: (username, password) =>
      request('/auth/login', { method: 'POST', body: { username, password } }).then((payload) => payload.data),
    me: () => request('/auth/me', { auth: true }).then((payload) => payload.data.user),
    session: () => request('/auth/session', { auth: true }).then((payload) => payload.data),
    logout: () => request('/auth/logout', { method: 'POST' }).then((payload) => payload.data),
  },

  admin: {
    stats: () => request('/admin/stats', { auth: true }).then((payload) => payload.data),
    provider: () => request('/admin/provider', { auth: true }).then((payload) => payload.data),
    seed: (force = false) => request('/admin/seed', { method: 'POST', body: { force }, auth: true }).then((payload) => payload.data),
    importMovie: (externalId, refresh = false) =>
      request('/admin/import', { method: 'POST', body: { externalId, refresh }, auth: true }).then((payload) => payload.data),
    importTrending: (limit = 5, refresh = false) =>
      request('/admin/import/trending', { method: 'POST', body: { limit, refresh }, auth: true }).then((payload) => payload.data),
  },

  provider: {
    trending: (limit = 12) => request(`/provider/trending${qs({ limit })}`).then((payload) => payload.data),
    list: (kind, { page = 1, limit = 20 } = {}) =>
      request(`/provider/${encodeURIComponent(kind)}${qs({ page, limit })}`).then((payload) => payload.data),
    search: (q, { page = 1, limit = 20 } = {}) =>
      request(`/provider/search${qs({ q, page, limit })}`).then((payload) => payload.data),
    detail: (externalId) =>
      request(`/provider/detail/${encodeURIComponent(externalId)}`).then((payload) => payload.data),
  },
};

export default api;

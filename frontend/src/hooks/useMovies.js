import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client.js';

/** Delays a rapidly changing value (search boxes) before it hits the API. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Fetches a movie list for the given query object.
 * `params` is serialised into the dependency list, so the request only re-runs
 * when a filter actually changes (and stale responses are discarded).
 */
export function useMovies(params = {}, { enabled = true } = {}) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ items: [], meta: {}, loading: enabled, error: null });
  const requestId = useRef(0);

  const load = useCallback(
    async (signal) => {
      const id = requestId.current + 1;
      requestId.current = id;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const { items, meta } = await api.movies.list(JSON.parse(key), { signal });
        if (requestId.current !== id) return;
        setState({ items, meta, loading: false, error: null });
      } catch (error) {
        if (error.name === 'AbortError' || requestId.current !== id) return;
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    [key],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, enabled]);

  const reload = useCallback(() => load(), [load]);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
}

/** Loads /api/meta once per mount (sorts, genres, provider status). */
export function useMeta() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .meta()
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, error, loading: !meta && !error };
}

/**
 * Fetches a live list from the external provider passthrough (backend proxies the
 * call, so the API key never reaches the browser).
 * kind: 'trending' | 'popular' | 'top-rated' | 'upcoming' | 'now-playing' | search via query
 */
export function useProviderList(kind = 'popular', { limit = 20, page = 1, query = '' } = {}) {
  const [state, setState] = useState({ items: [], meta: {}, loading: true, error: null });
  const [refreshTick, setRefreshTick] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    if (kind === 'search' && !query.trim()) {
      setState({ items: [], meta: {}, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    const id = requestId.current + 1;
    requestId.current = id;
    setState((current) => ({ ...current, loading: true, error: null }));

    const request =
      kind === 'search'
        ? api.provider.search(query.trim(), { page, limit })
        : kind === 'trending'
          ? api.provider.trending(limit)
          : api.provider.list(kind, { page, limit });

    request
      .then((data) => {
        if (requestId.current !== id) return;
        setState({ items: data.items || [], meta: data, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name === 'AbortError' || requestId.current !== id) return;
        setState((current) => ({ ...current, items: [], loading: false, error }));
      });

    return () => controller.abort();
  }, [kind, query, page, limit, refreshTick]);

  const reload = useCallback(() => setRefreshTick((tick) => tick + 1), []);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
}

export default useMovies;

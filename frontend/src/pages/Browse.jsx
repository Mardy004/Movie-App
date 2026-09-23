import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieFilters from '../components/movies/MovieFilters.jsx';
import MovieGrid from '../components/movies/MovieGrid.jsx';
import { ErrorState, SectionHeading } from '../components/common/StateBlocks.jsx';
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon, SparklesIcon } from '../components/common/Icons.jsx';
import { useDebounced, useMeta, useMovies, useProviderList } from '../hooks/useMovies.js';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { sortLabels } from '../utils/format.js';

const PAGE_SIZE = 20;

/** Amazon-style browse categories served straight from the external provider. */
const CATEGORIES = [
  { value: 'trending', label: 'Trending this week' },
  { value: 'popular', label: 'Popular' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'upcoming', label: 'Upcoming' },
];

const categoryLabels = Object.fromEntries(CATEGORIES.map((entry) => [entry.value, entry.label]));

/** Browse / search screen - provider powered, with the local library one tap away. */
export default function Browse() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { meta } = useMeta();

  const category = CATEGORIES.some((entry) => entry.value === params.get('category'))
    ? params.get('category')
    : 'trending';
  // The local catalogue stays reachable through ?library=1 (likes, comments).
  const isLibrary = params.get('library') === '1';

  const sort = params.get('sort') || 'trending';
  const genre = params.get('genre') || '';
  const status = params.get('status') || '';
  const page = Math.max(1, Number(params.get('page') || 1));
  const urlQuery = params.get('q') || '';

  const [searchText, setSearchText] = useState(urlQuery);
  const debouncedQuery = useDebounced(searchText, 350);

  const updateParams = useCallback(
    (changes) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
        });
        return next;
      });
    },
    [setParams],
  );

  // Keep the address bar in sync with the debounced search box.
  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    updateParams({ q: debouncedQuery || null, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // A fresh URL (back button, shared link) resets the input.
  useEffect(() => {
    setSearchText((current) => (current.trim() === urlQuery ? current : urlQuery));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const searchKind = urlQuery ? 'search' : category;
  const provider = useProviderList(searchKind, { query: urlQuery, page, limit: PAGE_SIZE });

  const libraryParams = useMemo(
    () => ({
      sort,
      genre: genre || undefined,
      status: status || undefined,
      q: urlQuery || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [sort, genre, status, urlQuery, page],
  );

  const library = useMovies(libraryParams, { enabled: isLibrary });
  const active = isLibrary ? library : provider;

  const handleLike = useCallback(
    async (movie) => {
      try {
        await api.movies.like(movie.id);
        toast.success(`Liked ${movie.title}`);
        library.reload();
      } catch (likeError) {
        toast.error(likeError.message);
      }
    },
    [toast, library],
  );

  const resetFilters = () => {
    setSearchText('');
    updateParams({ q: null, category: null, genre: null, status: null, sort: null, page: null, library: null });
  };

  const totalPages = active.meta.totalPages || (active.meta.total ? Math.ceil(active.meta.total / PAGE_SIZE) : 1);
  const SortIcon = category === 'trending' ? FlameIcon : SparklesIcon;
  const heading = urlQuery
    ? `Results for “${urlQuery}”`
    : isLibrary
      ? sortLabels[sort] || 'Your library'
      : categoryLabels[category] || 'Browse movies';

  return (
    <div className="shell section space-y-6">
      <SectionHeading
        icon={SortIcon}
        title={heading}
        subtitle={
          isLibrary
            ? 'Your imported catalogue - filters live in the URL so views can be shared'
            : 'switch to your library for likes and comments'
        }
        tone={category === 'trending' ? 'coral' : 'brand'}
      />

      {/* Amazon-style category tabs (provider mode) */}
      {!isLibrary ? (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Browse categories">
          {CATEGORIES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={category === entry.value}
              className={`chip transition hover:border-brand-400/50 ${category === entry.value ? 'chip-active' : ''}`}
              onClick={() => updateParams({ category: entry.value === 'trending' ? null : entry.value, page: null })}
            >
              {entry.label}
            </button>
          ))}
          <button
            type="button"
            className="chip ml-auto"
            onClick={() => updateParams({ library: '1', category: null, page: null })}
            title="Browse the locally imported catalogue instead"
          >
            Use my library
          </button>
        </div>
      ) : null}

      {isLibrary ? (
        <MovieFilters
          query={searchText}
          onQueryChange={setSearchText}
          sort={sort}
          onSortChange={(value) => updateParams({ sort: value, page: null })}
          genre={genre}
          onGenreChange={(value) => updateParams({ genre: value || null, page: null })}
          status={status}
          onStatusChange={(value) => updateParams({ status: value || null, page: null })}
          genres={meta?.genres || []}
          total={library.meta.total}
          loading={library.loading}
          onReset={() => {
            resetFilters();
            updateParams({ library: '1' });
          }}
        />
      ) : (
        <MovieFilters
          query={searchText}
          onQueryChange={setSearchText}
          total={provider.meta.total}
          loading={provider.loading}
          onReset={resetFilters}
          hideLibraryFilters
        />
      )}

      {active.error ? (
        <ErrorState error={active.error} onRetry={active.reload} title="Could not load movies" />
      ) : (
        <MovieGrid
          movies={active.items}
          loading={active.loading}
          onLike={isLibrary ? handleLike : undefined}
          onClearFilters={resetFilters}
          emptyTitle={urlQuery ? `No results for “${urlQuery}”` : 'No movies found'}
          emptyMessage={
            urlQuery
              ? 'Check the spelling or try a shorter search term.'
              : isLibrary
                ? 'Import some titles from the admin dashboard first.'
                : undefined
          }
        />
      )}

      {!active.loading && !active.error && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: page - 1 })}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs font-semibold text-fog-400">
            Page {active.meta.page || page} of {totalPages} • {active.meta.total || 0} movies
          </span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: page + 1 })}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
import { FilterIcon, SearchIcon } from '../common/Icons.jsx';
import { sortLabels } from '../../utils/format.js';

/**
 * Browse controls: search field, sort selector and genre chips, each in its own
 * labelled group so the toolbar stays readable instead of one tall column.
 */
export default function MovieFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
  genre,
  onGenreChange,
  status,
  onStatusChange,
  genres = [],
  total,
  loading,
  onReset,
  hideLibraryFilters = false,
}) {
  const sortKeys = Object.keys(sortLabels);

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fog-500">
        <FilterIcon className="h-4 w-4" />
        Filters
        {typeof total === 'number' && !loading ? (
          <span className="ml-auto rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-fog-300">
            {total.toLocaleString()} {total === 1 ? 'movie' : 'movies'}
          </span>
        ) : null}
      </div>

      <div className={`mt-4 grid gap-4 ${hideLibraryFilters ? '' : 'lg:grid-cols-[1.4fr,1fr,1fr]'}`}>
        <label className="block">
          <span className="field-label">Search</span>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Title, tagline, cast…"
              className="field pl-9"
            />
          </span>
        </label>

        {!hideLibraryFilters ? (
          <>
            <label className="block">
              <span className="field-label">Sort by</span>
              <select value={sort} onChange={(event) => onSortChange(event.target.value)} className="field appearance-none">
                {sortKeys.map((key) => (
                  <option key={key} value={key} className="bg-ink-900">
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="field-label">Release status</span>
              <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="field appearance-none">
                <option value="" className="bg-ink-900">
                  All statuses
                </option>
                <option value="released" className="bg-ink-900">
                  Released
                </option>
                <option value="upcoming" className="bg-ink-900">
                  Upcoming
                </option>
                <option value="archived" className="bg-ink-900">
                  Archived
                </option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      {genres.length ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="field-label mb-0">Genres</span>
            {genre || query || status || sort !== 'trending' ? (
              <button type="button" className="text-[11px] font-semibold text-brand-300 hover:text-brand-400" onClick={onReset}>
                Reset all
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`chip transition hover:border-brand-400/50 ${!genre ? 'chip-active' : ''}`}
              onClick={() => onGenreChange('')}
            >
              All
            </button>
            {genres.map((entry) => {
              const active = genre.toLowerCase() === entry.name.toLowerCase();
              return (
                <button
                  key={entry.slug}
                  type="button"
                  className={`chip transition hover:border-brand-400/50 ${active ? 'chip-active' : ''}`}
                  onClick={() => onGenreChange(active ? '' : entry.name)}
                >
                  {entry.name}
                  <span className="text-fog-500">{entry.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
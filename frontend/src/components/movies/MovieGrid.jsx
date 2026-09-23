import MovieCard from './MovieCard.jsx';
import { EmptyState, SkeletonGrid } from '../common/StateBlocks.jsx';

/** Responsive poster grid: 2 columns on phones up to 5 on wide screens. */
export default function MovieGrid({ movies = [], loading = false, emptyTitle, emptyMessage, onLike, onClearFilters }) {
  if (loading) return <SkeletonGrid count={10} />;

  if (!movies.length) {
    return (
      <EmptyState
        icon="search"
        title={emptyTitle || 'No movies match your filters'}
        message={emptyMessage || 'Try a different search term, sort order or genre.'}
        action={
          onClearFilters ? (
            <button type="button" className="btn-ghost mt-3" onClick={onClearFilters}>
              Clear filters
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id ?? movie.externalId} movie={movie} onLike={onLike} />
      ))}
    </div>
  );
}

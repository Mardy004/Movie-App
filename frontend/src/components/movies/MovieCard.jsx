import { Link } from 'react-router-dom';
import Poster from './Poster.jsx';
import { HeartIcon, PlayIcon, StarIcon } from '../common/Icons.jsx';
import { NewBadge, StatusBadge } from '../common/Chips.jsx';
import { compactNumber, formatRuntime } from '../../utils/format.js';

/**
 * Poster card used in rails and grids. Mirrors a React Native touch card:
 * large tap target, rounded surface, subtle press/hover feedback.
 */
export default function MovieCard({ movie, rank, onLike, className = '', style }) {
  // Provider items carry externalId; imported library items carry id.
  const movieId = movie.id ?? movie.externalId;
  return (
    <article className={`card card-hover group overflow-hidden ${className}`} style={style}>
      <Link to={`/movies/${movieId}`} className="block" aria-label={`Open ${movie.title}`}>
        <div className="relative">
          <Poster movie={movie} ratio="aspect-[2/3]" rounded="rounded-none" />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {typeof rank === 'number' ? <span className="badge-trending">#{rank}</span> : null}
            {movie.isFresh ? <NewBadge /> : <StatusBadge movie={movie} />}
          </div>
          <span className="badge-rating absolute right-2.5 top-2.5">
            <StarIcon className="h-3.5 w-3.5" filled />
            {Number(movie.rating || 0).toFixed(1)}
          </span>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-white shadow-glow">
              <PlayIcon className="h-5 w-5" filled />
            </span>
          </div>
        </div>
        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-fog-50">{movie.title}</h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fog-400">
            <span>{movie.releaseYear || (movie.releaseDate ? movie.releaseDate.slice(0, 4) : 'TBA')}</span>
            <span className="text-fog-600">•</span>
            <span>{formatRuntime(movie.runtimeMinutes)}</span>
            <span className="text-fog-600">•</span>
            <span className="line-clamp-1">{movie.genres?.[0] || 'Uncategorised'}</span>
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-mint-400">
          <HeartIcon className="h-3.5 w-3.5" filled />
          {compactNumber(movie.likes)}
        </span>
        {onLike ? (
          <button
            type="button"
            className="rounded-xl px-2 py-1 text-[11px] font-semibold text-fog-300 transition hover:bg-brand-500/15 hover:text-fog-50"
            onClick={() => onLike(movie)}
          >
            Like
          </button>
        ) : (
          <Link
            to={`/movies/${movieId}`}
            className="rounded-xl px-2 py-1 text-[11px] font-semibold text-fog-300 transition hover:bg-brand-500/15 hover:text-fog-50"
          >
            Details
          </Link>
        )}
      </div>
    </article>
  );
}

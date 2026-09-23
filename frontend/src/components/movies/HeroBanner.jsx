import { Link } from 'react-router-dom';
import Poster from './Poster.jsx';
import { EyeIcon, FlameIcon, HeartIcon, PlayIcon, StarIcon } from '../common/Icons.jsx';
import { compactNumber, formatDate, formatRuntime } from '../../utils/format.js';

/**
 * Featured hero for the home screen.
 * Split layout (copy beside artwork) so nothing is crammed into one column.
 */
export default function HeroBanner({ movie }) {
  if (!movie) {
    return (
      <div className="card skeleton h-72 w-full sm:h-80" aria-hidden="true" />
    );
  }

  return (
    <section className="card relative overflow-hidden">
      {/* backdrop layer */}
      {movie.backdropUrl ? (
        <img
          src={movie.backdropUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.35fr,0.65fr] lg:items-center lg:gap-8 lg:p-9">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-trending">
              <FlameIcon className="h-3.5 w-3.5" filled />
              #1 trending this week
            </span>
            {movie.isFresh ? <span className="badge-new">Recently added</span> : null}
            <span className="badge bg-white/10 text-fog-300">{movie.genres?.[0] || 'Featured'}</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fog-50 sm:text-4xl lg:text-5xl">
            {movie.title}
          </h1>

          {movie.tagline ? <p className="text-sm italic text-brand-300 sm:text-base">{movie.tagline}</p> : null}

          <p className="max-w-2xl text-sm leading-relaxed text-fog-300 line-clamp-3 sm:text-base">{movie.overview}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-fog-300 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 text-accent-400">
              <StarIcon className="h-4 w-4" filled />
              {Number(movie.rating || 0).toFixed(1)} / 10
            </span>
            <span>{formatRuntime(movie.runtimeMinutes)}</span>
            <span>{formatDate(movie.releaseDate)}</span>
            <span className="inline-flex items-center gap-1.5">
              <EyeIcon className="h-4 w-4" />
              {compactNumber(movie.views)} views
            </span>
            <span className="inline-flex items-center gap-1.5 text-mint-400">
              <HeartIcon className="h-4 w-4" filled />
              {compactNumber(movie.likes)} likes
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to={`/movies/${movie.id ?? movie.externalId}`} className="btn-primary">
              <PlayIcon className="h-4 w-4" filled />
              View details
            </Link>
            <Link to="/browse?sort=trending" className="btn-ghost">
              <FlameIcon className="h-4 w-4" />
              See all trending
            </Link>
          </div>
        </div>

        {/* artwork column - kept separate from the copy column */}
        <div className="mx-auto w-40 shrink-0 sm:w-48 lg:mx-0 lg:w-full lg:max-w-[260px] lg:justify-self-end">
          <Link to={`/movies/${movie.id ?? movie.externalId}`} aria-label={`Open ${movie.title}`}>
            <Poster movie={movie} rounded="rounded-3xl" className="shadow-card ring-1 ring-white/10" />
          </Link>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-2 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-fog-500">Trending score</dt>
              <dd className="text-sm font-bold text-fog-50">{Math.round(movie.trendingScore || 0)}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-2 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-fog-500">Status</dt>
              <dd className="text-sm font-bold capitalize text-fog-50">{movie.status || 'released'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
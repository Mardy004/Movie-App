import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Poster from '../components/movies/Poster.jsx';
import MovieRail from '../components/movies/MovieRail.jsx';
import { GenreChips, RatingPill, StatusBadge } from '../components/common/Chips.jsx';
import { ErrorState, LoadingBlock } from '../components/common/StateBlocks.jsx';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon,
  PencilIcon,
  PlayIcon,
  TagIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../components/common/Icons.jsx';
import { useProviderList } from '../hooks/useMovies.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import CommentSection from '../components/comments/CommentSection.jsx';
import WatchModal from '../components/movies/WatchModal.jsx';
import { compactNumber, formatDate, formatRuntime } from '../utils/format.js';

/** Movie detail screen: artwork, metadata, engagement actions and suggestions. */
export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [watchInfo, setWatchInfo] = useState(null);
  const viewLogged = useRef('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Numeric route ids are provider titles: fetch the rich detail payload live.
      if (/^\d+$/.test(id)) {
        try {
          setMovie(await api.provider.detail(id));
          return;
        } catch (providerError) {
          // Fall through to the local catalogue (seeded/imported items).
          setMovie(await api.movies.get(id));
        }
      } else {
        setMovie(await api.movies.get(id));
      }
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Library-only engagement: provider passthrough titles have no local record,
  // so views / likes / watch only apply to imported catalogue entries.
  const isLibraryItem = Boolean(movie?.id && movie?.source !== 'external');

  // Count one view per movie per mount (feeds the trending score).
  useEffect(() => {
    if (!isLibraryItem || viewLogged.current === movie.id) return;
    viewLogged.current = movie.id;
    api.movies
      .view(movie.id)
      .then((data) =>
        setMovie((current) => (current ? { ...current, views: data.views, trendingScore: data.trendingScore } : current)),
      )
      .catch(() => undefined);
  }, [isLibraryItem, movie]);

  const related = useProviderList('popular', { limit: 12 });
  const relatedItems = related.items.filter(
    (item) => String(item.externalId) !== String(movie?.externalId),
  );

  const openWatch = useCallback(async () => {
    if (!isLibraryItem) {
      toast.error('Import this title to the catalogue first (admin dashboard) to enable playback.');
      return;
    }
    try {
      const info = await api.movies.watch(id);
      setWatchInfo(info);
      setWatchOpen(true);
    } catch (watchError) {
      toast.error(watchError.message);
    }
  }, [id, toast, isLibraryItem]);

  const handleLike = useCallback(async () => {
    if (!movie) return;
    setBusy(true);
    try {
      const data = liked ? await api.movies.unlike(movie.id) : await api.movies.like(movie.id);
      setLiked(!liked);
      setMovie((current) => (current ? { ...current, likes: data.likes, trendingScore: data.trendingScore } : current));
      toast.success(liked ? 'Like removed' : `Liked ${movie.title}`);
    } catch (likeError) {
      toast.error(likeError.message);
    } finally {
      setBusy(false);
    }
  }, [movie, liked, toast]);

  if (loading) {
    return (
      <div className="shell section">
        <LoadingBlock label="Loading movie…" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="shell section space-y-4">
        <ErrorState error={error} title="Movie not available" onRetry={load} />
        <div className="flex justify-center">
          <Link to="/browse" className="btn-ghost">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell section space-y-10">
      <button type="button" className="btn-ghost btn-sm w-fit" onClick={() => navigate(-1)}>
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </button>
      <section className="card relative overflow-hidden">
        {movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/90 to-ink-950" />

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[280px,1fr] lg:gap-8 lg:p-8">
          <div className="mx-auto w-44 sm:w-56 lg:mx-0 lg:w-full">
            <Poster movie={movie} rounded="rounded-3xl" className="shadow-card ring-1 ring-white/10" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-fog-500">Views</p>
                <p className="text-sm font-bold text-fog-50">{compactNumber(movie.views)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-fog-500">Likes</p>
                <p className="text-sm font-bold text-mint-400">{compactNumber(movie.likes)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge movie={movie} />
              {movie.isFresh ? <span className="badge-new">Recently added</span> : null}
              <span className="badge bg-white/10 text-fog-300">
                <TrendingUpIcon className="h-3.5 w-3.5" />
                Score {Math.round(movie.trendingScore || 0)}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fog-50 sm:text-4xl">{movie.title}</h1>
              {movie.tagline ? <p className="text-sm italic text-brand-300 sm:text-base">{movie.tagline}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-fog-300">
              <RatingPill value={movie.rating} />
              <span className="chip">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDate(movie.releaseDate)}
              </span>
              <span className="chip">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatRuntime(movie.runtimeMinutes)}
              </span>
              <span className="chip">
                <EyeIcon className="h-3.5 w-3.5" />
                {compactNumber(movie.views)} views
              </span>
              <span className="chip uppercase">{movie.language}</span>
            </div>

            {movie.overview ? (
              <p className="max-w-3xl text-sm leading-relaxed text-fog-300 sm:text-base">{movie.overview}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isLibraryItem ? (
                <button type="button" className="btn-primary" onClick={openWatch}>
                  <PlayIcon className="h-4 w-4" filled />
                  Watch now
                </button>
              ) : movie.trailerUrl ? (
                <a href={movie.trailerUrl} target="_blank" rel="noreferrer noopener" className="btn-primary">
                  <PlayIcon className="h-4 w-4" filled />
                  Watch trailer
                </a>
              ) : null}
              {isLibraryItem && movie.videoUrl ? (
                <a href={api.movies.streamUrl(movie.id, { download: true })} className="btn-accent" download>
                  <PlayIcon className="h-4 w-4" />
                  Download
                </a>
              ) : null}
              {isLibraryItem ? (
                <button type="button" className={liked ? 'btn-accent' : 'btn-ghost'} onClick={handleLike} disabled={busy}>
                  <HeartIcon className="h-4 w-4" filled={liked} />
                  {liked ? 'Liked' : 'Like'}
                </button>
              ) : null}
              {isAuthenticated && isLibraryItem ? (
                <Link to={`/admin?edit=${movie.id}`} className="btn-ghost">
                  <PencilIcon className="h-4 w-4" />
                  Edit in dashboard
                </Link>
              ) : null}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">Genres</p>
              <GenreChips genres={movie.genres} />
            </div>

            {movie.cast?.length ? (
              <div>
                <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Cast
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((person) => (
                    <span key={person} className="chip">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {movie.externalId ? (
              <p className="inline-flex items-center gap-2 text-[11px] text-fog-500">
                <TagIcon className="h-3.5 w-3.5" />
                External id {movie.externalId} • source {movie.source || 'local'}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <WatchModal open={watchOpen} onClose={() => setWatchOpen(false)} movie={movie} watch={watchInfo} />

      {isLibraryItem ? <CommentSection movieId={movie.id} /> : null}

      <MovieRail
        title="More like this"
        subtitle="Popular titles you might also enjoy"
        icon={<PlayIcon className="h-5 w-5" />}
        movies={relatedItems}
        loading={related.loading}
        viewAllTo="/browse?category=popular"
      />
    </div>
  );
}
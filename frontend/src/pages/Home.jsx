import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/movies/HeroBanner.jsx';
import MovieRail from '../components/movies/MovieRail.jsx';
import { GenreChips } from '../components/common/Chips.jsx';
import { ErrorState, SectionHeading } from '../components/common/StateBlocks.jsx';
import {
  FlameIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
} from '../components/common/Icons.jsx';
import { useMeta, useProviderList } from '../hooks/useMovies.js';

/** Amazon-Prime-Video-inspired landing: hero + horizontally scrolling rails. */
export default function Home() {
  const { meta } = useMeta();

  // All rails read live provider data through the backend passthrough.
  const trending = useProviderList('trending', { limit: 20 });
  const popular = useProviderList('popular', { limit: 20 });
  const topRated = useProviderList('top-rated', { limit: 20 });
  const upcoming = useProviderList('upcoming', { limit: 20 });

  const featured = trending.items[0];
  const loadError = trending.error || popular.error;

  const genreChips = useMemo(() => (meta?.genres || []).slice(0, 12), [meta]);

  return (
    <div className="shell section space-y-10">
      {loadError && !trending.items.length ? (
        <ErrorState error={loadError} onRetry={trending.reload} title="Could not reach the movie service" />
      ) : (
        <HeroBanner movie={featured} />
      )}

      <MovieRail
        title="Trending now"
        subtitle="The most-watched titles this week"
        icon={<FlameIcon className="h-5 w-5" />}
        movies={trending.items}
        loading={trending.loading}
        ranked
        viewAllTo="/browse?sort=trending"
      />

      <MovieRail
        title="Popular with audiences"
        subtitle="What everyone is watching right now"
        icon={<SparklesIcon className="h-5 w-5" />}
        movies={popular.items}
        loading={popular.loading}
        viewAllTo="/browse?category=popular"
      />

      <MovieRail
        title="Top rated"
        subtitle="The highest-scoring movies of all time"
        icon={<StarIcon className="h-5 w-5" />}
        movies={topRated.items}
        loading={topRated.loading}
        viewAllTo="/browse?category=top-rated"
      />

      <MovieRail
        title="Coming soon"
        subtitle="Upcoming releases to look forward to"
        icon={<TrendingUpIcon className="h-5 w-5" />}
        movies={upcoming.items}
        loading={upcoming.loading}
        viewAllTo="/browse?category=upcoming"
        emptyMessage="No upcoming releases right now."
      />

      <section className="space-y-3">
        <SectionHeading
          icon={TrendingUpIcon}
          title="Browse by genre"
          subtitle="Jump straight into a mood"
          tone="sky"
          action={
            <Link to="/browse" className="btn-ghost btn-sm">
              Open browse
            </Link>
          }
        />
        {genreChips.length ? (
          <GenreChips genres={genreChips} />
        ) : (
          <div className="card px-5 py-6 text-sm text-fog-400">Genres appear once movies are imported.</div>
        )}
      </section>

      <AdminCta />
    </div>
  );
}

/** Admin call-to-action band shown at the end of the home screen. */
function AdminCta() {
  // return (
  //   <section className="card relative overflow-hidden p-5 sm:p-7">
  //     <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
  //     <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  //       <div className="max-w-2xl space-y-1.5">
  //         <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
  //           <ShieldIcon className="h-4 w-4" />
  //           Admin studio
  //         </p>
  //         <h2 className="text-xl font-extrabold tracking-tight text-fog-50 sm:text-2xl">
  //           Add, update and retire titles without touching code
  //         </h2>
  //         <p className="text-sm text-fog-400">
  //           Sign in as an admin to manage the catalogue, import titles from your movie API and watch trending react as
  //           views and likes come in.
  //         </p>
  //       </div>
  //       <div className="flex flex-wrap gap-3">
  //         <Link to="/admin/login" className="btn-primary">
  //           <ShieldIcon className="h-4 w-4" />
  //           Admin sign in
  //         </Link>
  //         <Link to="/browse?sort=recently-added" className="btn-ghost">
  //           See what is new
  //         </Link>
  //       </div>
  //     </div>
  //   </section>
  // );
}
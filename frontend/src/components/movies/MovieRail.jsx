import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard.jsx';
import { ChevronLeftIcon, ChevronRightIcon } from '../common/Icons.jsx';
import { SkeletonCard } from '../common/StateBlocks.jsx';

/**
 * Horizontal, snap-scrolling rail (React Native ScrollView feel).
 * Arrows appear on pointer devices; touch devices just swipe.
 */
export default function MovieRail({ title, subtitle, icon, movies = [], loading = false, ranked = false, viewAllTo, onLike, emptyMessage }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const syncEdges = useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    setEdges({
      start: node.scrollLeft <= 8,
      end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    syncEdges();
    const node = scroller.current;
    if (!node) return undefined;
    node.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges);
    return () => {
      node.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
    };
  }, [syncEdges, movies.length]);

  const scrollBy = (direction) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-accent-400">{icon}</span>
          ) : null}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-fog-50 sm:text-xl">{title}</h2>
            {subtitle ? <p className="text-xs text-fog-400 sm:text-sm">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewAllTo ? (
            <Link to={viewAllTo} className="btn-ghost btn-sm">
              View all
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              className="icon-btn h-9 w-9 disabled:opacity-30"
              onClick={() => scrollBy(-1)}
              disabled={edges.start}
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="icon-btn h-9 w-9 disabled:opacity-30"
              onClick={() => scrollBy(1)}
              disabled={edges.end}
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="w-[46%] shrink-0 xs:w-[38%] sm:w-[31%] lg:w-[19%]">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : movies.length ? (
        <div className="rail -mx-1 px-1" ref={scroller}>
          {movies.map((movie, index) => (
            <div key={movie.id ?? movie.externalId} className="rail-item w-[46%] shrink-0 xs:w-[38%] sm:w-[31%] lg:w-[19%]">
              <MovieCard movie={movie} rank={ranked ? index + 1 : undefined} onLike={onLike} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card px-5 py-8 text-center text-sm text-fog-400">{emptyMessage || 'No movies to show yet.'}</div>
      )}
    </section>
  );
}

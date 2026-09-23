import { useEffect, useState } from 'react';
import { FilmIcon } from '../common/Icons.jsx';
import { gradientFor, initials } from '../../utils/format.js';

/**
 * Poster with a palette-driven gradient fallback: broken/blank artwork never
 * shows a browser "missing image" icon, which keeps the RN-style cards tidy.
 */
export default function Poster({ movie, ratio = 'aspect-[2/3]', className = '', rounded = 'rounded-2xl', sizes }) {
  const [failed, setFailed] = useState(false);
  const url = movie?.posterUrl;

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const [from, to] = gradientFor(movie?.id || movie?.title || 'movieshow');
  const showFallback = !url || failed;

  return (
    <div className={`relative overflow-hidden ${rounded} ${ratio} ${className} bg-ink-800`}>
      {showFallback ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center"
          style={{ backgroundImage: `linear-gradient(150deg, ${from} 0%, ${to} 78%)` }}
        >
          <FilmIcon className="h-7 w-7 text-white/70" />
          <span className="text-lg font-extrabold tracking-tight text-white/90">{initials(movie?.title)}</span>
          <span className="line-clamp-2 text-[11px] font-medium text-white/70">{movie?.title}</span>
        </div>
      ) : (
        <img
          src={url}
          alt={`${movie?.title || 'Movie'} poster`}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </div>
  );
}

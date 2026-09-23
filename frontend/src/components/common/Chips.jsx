import { ClockIcon, EyeIcon, HeartIcon, StarIcon } from './Icons.jsx';
import { compactNumber, formatRuntime } from '../../utils/format.js';

export function RatingPill({ value, className = '' }) {
  return (
    <span className={`badge-rating ${className}`} title={`Rated ${Number(value || 0).toFixed(1)} / 10`}>
      <StarIcon className="h-3.5 w-3.5" filled />
      {Number(value || 0).toFixed(1)}
    </span>
  );
}

export function StatusBadge({ movie }) {
  if (movie?.isUpcoming || movie?.status === 'upcoming') {
    return <span className="badge-upcoming">Upcoming</span>;
  }
  if (movie?.status === 'archived') return <span className="badge bg-white/10 text-fog-400">Archived</span>;
  return null;
}

export function TrendingBadge({ rank }) {
  return (
    <span className="badge-trending">
      #{rank} trending
    </span>
  );
}

export function NewBadge({ label = 'New' }) {
  return <span className="badge-new">{label}</span>;
}

export function RuntimeChip({ minutes }) {
  return (
    <span className="chip">
      <ClockIcon className="h-3.5 w-3.5" />
      {formatRuntime(minutes)}
    </span>
  );
}

export function MetricChip({ icon, value, label }) {
  const Icon = icon;
  return (
    <span className="chip" title={label}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {compactNumber(value)}
    </span>
  );
}

export function LikeChip({ likes }) {
  return <MetricChip icon={HeartIcon} value={likes} label={`${likes} likes`} />;
}

export function ViewChip({ views }) {
  return <MetricChip icon={EyeIcon} value={views} label={`${views} views`} />;
}

export function GenreChips({ genres = [], onSelect, activeGenre }) {
  if (!genres.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const label = typeof genre === 'string' ? genre : genre.name;
        const isActive = activeGenre && label.toLowerCase() === String(activeGenre).toLowerCase();
        return onSelect ? (
          <button
            key={label}
            type="button"
            className={`chip transition hover:border-brand-400/50 hover:text-fog-100 ${isActive ? 'chip-active' : ''}`}
            onClick={() => onSelect(isActive ? '' : label)}
          >
            {label}
            {typeof genre === 'object' && genre.count ? <span className="text-fog-500">{genre.count}</span> : null}
          </button>
        ) : (
          <span key={label} className="chip">
            {label}
          </span>
        );
      })}
    </div>
  );
}

export default { RatingPill, StatusBadge, TrendingBadge, NewBadge, RuntimeChip, GenreChips, LikeChip, ViewChip };

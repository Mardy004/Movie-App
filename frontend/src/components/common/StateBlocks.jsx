import { AlertIcon, FilmIcon, RefreshIcon, SearchIcon } from './Icons.jsx';

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/25 border-t-brand-400 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingBlock({ label = 'Loading movies…' }) {
  return (
    <div className="card flex items-center justify-center gap-3 px-6 py-12 text-sm text-fog-400">
      <Spinner />
      {label}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon = 'film' }) {
  const Icon = icon === 'search' ? SearchIcon : FilmIcon;
  return (
    <div className="empty-state">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-lg font-semibold text-fog-50">{title}</h3>
      {message ? <p className="max-w-md text-sm text-fog-400">{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty-state border-coral-500/30">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-coral-500/15 text-coral-400">
        <AlertIcon className="h-7 w-7" />
      </span>
      <h3 className="text-lg font-semibold text-fog-50">{title}</h3>
      <p className="max-w-md text-sm text-fog-400">{error?.message || 'Unexpected error.'}</p>
      {Array.isArray(error?.details) && error.details.length ? (
        <ul className="mt-1 list-inside list-disc text-left text-xs text-coral-400/90">
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {onRetry ? (
        <button type="button" className="btn-ghost mt-3" onClick={onRetry}>
          <RefreshIcon className="h-4 w-4" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function SectionHeading({ icon: Icon, title, subtitle, action, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-500/15 text-brand-300',
    coral: 'bg-coral-500/15 text-coral-400',
    sky: 'bg-sky-500/15 text-sky-400',
    accent: 'bg-accent-500/15 text-accent-400',
    mint: 'bg-mint-500/15 text-mint-400',
  };
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone] || tones.brand}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-fog-50 sm:text-xl">{title}</h2>
          {subtitle ? <p className="text-xs text-fog-400 sm:text-sm">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export default { Spinner, LoadingBlock, SkeletonCard, SkeletonGrid, EmptyState, ErrorState, SectionHeading };

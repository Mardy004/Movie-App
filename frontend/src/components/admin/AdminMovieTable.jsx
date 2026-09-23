import { useState } from 'react';
import { Link } from 'react-router-dom';
import Poster from '../movies/Poster.jsx';
import { CheckIcon, PencilIcon, RefreshIcon, TrashIcon } from '../common/Icons.jsx';
import { compactNumber, formatDate, timeAgo } from '../../utils/format.js';

const SORTABLE = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'rating', label: 'Rating' },
  { key: 'views', label: 'Views' },
  { key: 'createdAt', label: 'Added' },
];

const statusTone = (status) =>
  status === 'released'
    ? 'bg-mint-500/15 text-mint-400'
    : status === 'upcoming'
      ? 'bg-accent-500/15 text-accent-400'
      : 'bg-white/10 text-fog-400';

/**
 * Admin catalogue table. Cards on phones, table from md upwards - both driven
 * by the same row actions so nothing is hidden on small screens.
 */
export default function AdminMovieTable({ movies = [], sort, onSortChange, onEdit, onDelete, deletingId, refreshing, onRefresh }) {
  const [pendingId, setPendingId] = useState(null);

  const confirmDelete = (movie) => {
    if (pendingId === movie.id) {
      setPendingId(null);
      onDelete(movie);
      return;
    }
    setPendingId(movie.id);
  };

  if (!movies.length) {
    return (
      <div className="empty-state">
        <p className="text-sm text-fog-400">No movies match the current filters.</p>
        {onRefresh ? (
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={onRefresh}>
            <RefreshIcon className="h-4 w-4" />
            Reload
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fog-500">Sort</span>
          {SORTABLE.map((column) => (
            <button
              key={column.key}
              type="button"
              className={`chip ${sort === column.key ? 'chip-active' : ''}`}
              onClick={() => onSortChange(column.key)}
            >
              {column.label}
            </button>
          ))}
        </div>
        {onRefresh ? (
          <button type="button" className="btn-ghost btn-sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wide text-fog-500">
              <th className="px-4 py-3 font-semibold">Movie</th>
              <th className="px-4 py-3 font-semibold">Genres</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Views / Likes</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Poster movie={movie} ratio="aspect-[2/3]" rounded="rounded-xl" className="w-10 shrink-0" />
                    <div className="min-w-0">
                      <Link to={`/movies/${movie.id}`} className="line-clamp-1 font-semibold text-fog-50 hover:text-brand-300">
                        {movie.title}
                      </Link>
                      <p className="line-clamp-1 text-[11px] text-fog-500">
                        {movie.releaseDate ? formatDate(movie.releaseDate) : 'No release date'}
                        {movie.externalId ? ` • ext:${movie.externalId}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fog-400">{movie.genres?.slice(0, 2).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusTone(movie.status)}`}>{movie.status}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-accent-400">{Number(movie.rating || 0).toFixed(1)}</td>
                <td className="px-4 py-3 text-xs text-fog-400">
                  {compactNumber(movie.views)} / {compactNumber(movie.likes)}
                </td>
                <td className="px-4 py-3 text-xs text-fog-500">{timeAgo(movie.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <RowActions
                      movie={movie}
                      pending={pendingId === movie.id}
                      deleting={deletingId === movie.id}
                      onEdit={onEdit}
                      onDelete={confirmDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-white/5 md:hidden">
        {movies.map((movie) => (
          <li key={movie.id} className="flex gap-3 p-4">
            <Poster movie={movie} ratio="aspect-[2/3]" rounded="rounded-xl" className="w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <Link to={`/movies/${movie.id}`} className="line-clamp-1 font-semibold text-fog-50">
                {movie.title}
              </Link>
              <p className="mt-0.5 text-[11px] text-fog-500">
                {movie.status} • ★ {Number(movie.rating || 0).toFixed(1)} • {compactNumber(movie.views)} views
              </p>
              <div className="mt-2 flex items-center gap-2">
                <RowActions
                  movie={movie}
                  pending={pendingId === movie.id}
                  deleting={deletingId === movie.id}
                  onEdit={onEdit}
                  onDelete={confirmDelete}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Edit + two-step delete controls shared by the table and the phone cards. */
function RowActions({ movie, pending, deleting, onEdit, onDelete }) {
  return (
    <>
      <button type="button" className="btn-ghost btn-sm" onClick={() => onEdit(movie)}>
        <PencilIcon className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        type="button"
        className={`btn-sm ${pending ? 'btn-accent' : 'btn-danger'}`}
        onClick={() => onDelete(movie)}
        disabled={deleting}
        title={pending ? 'Click again to confirm' : 'Delete movie'}
      >
        {pending ? <CheckIcon className="h-3.5 w-3.5" /> : <TrashIcon className="h-3.5 w-3.5" />}
        {deleting ? 'Deleting…' : pending ? 'Confirm' : 'Delete'}
      </button>
    </>
  );
}
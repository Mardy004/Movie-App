import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminMovieTable from '../components/admin/AdminMovieTable.jsx';
import MovieForm from '../components/admin/MovieForm.jsx';
import StatCard from '../components/admin/StatCard.jsx';
import Modal from '../components/common/Modal.jsx';
import { ErrorState, LoadingBlock } from '../components/common/StateBlocks.jsx';
import {
  AlertIcon,
  CloudDownloadIcon,
  EyeIcon,
  FilmIcon,
  HeartIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
} from '../components/common/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { compactNumber, formatDate } from '../utils/format.js';

const FETCH_LIMIT = 100;

/** Admin studio: metrics, provider import tools, and the full CRUD table. */
export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('createdAt');

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [importId, setImportId] = useState('');
  const [importCount, setImportCount] = useState(5);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, statsData, providerData] = await Promise.all([
        api.movies.list({ sort: 'recently-added', limit: FETCH_LIMIT }),
        api.admin.stats(),
        api.admin.provider().catch(() => null),
      ]);
      setMovies(list.items);
      setStats(statsData);
      setProvider(providerData);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link support: /admin?edit=<movieId> opens the edit dialog.
  useEffect(() => {
    const editId = params.get('edit');
    if (!editId || !movies.length) return;
    const match = movies.find((movie) => movie.id === editId);
    if (match) {
      setEditing(match);
      setFormOpen(true);
      setParams(new URLSearchParams(), { replace: true });
    }
  }, [params, movies, setParams]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = movies;
    if (term) {
      list = list.filter((movie) =>
        [movie.title, movie.tagline, (movie.genres || []).join(' '), movie.externalId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(term),
      );
    }
    if (statusFilter) list = list.filter((movie) => movie.status === statusFilter);

    const sorted = [...list];
    switch (sort) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        sorted.sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.title.localeCompare(b.title));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'views':
        sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        sorted.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }
    return sorted;
  }, [movies, search, statusFilter, sort]);
  /* COMPONENT-BODY */

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (movie) => {
    setEditing(movie);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const saveMovie = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await api.movies.update(editing.id, payload);
        toast.success(`Updated “${payload.title}”`);
      } else {
        await api.movies.create(payload);
        toast.success(`Added “${payload.title}” to the catalogue`);
      }
      closeForm();
      await load();
    } catch (saveError) {
      toast.error(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMovie = async (movie) => {
    setDeletingId(movie.id);
    try {
      await api.movies.remove(movie.id);
      toast.success(`Deleted “${movie.title}”`);
      setMovies((current) => current.filter((item) => item.id !== movie.id));
      setStats((current) => (current ? { ...current, totalMovies: Math.max(0, current.totalMovies - 1) } : current));
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const runImport = async () => {
    if (!importId.trim()) {
      toast.warning('Enter the external movie id you want to import');
      return;
    }
    setImporting(true);
    try {
      const result = await api.admin.importMovie(importId.trim());
      const labels = { created: 'Imported', updated: 'Refreshed', skipped: 'Already in catalogue' };
      toast.success(`${labels[result.action] || 'Processed'}: ${result.movie?.title || importId}`);
      setImportId('');
      await load();
    } catch (importError) {
      toast.error(importError.message);
    } finally {
      setImporting(false);
    }
  };

  const runBulkImport = async () => {
    setImporting(true);
    try {
      const result = await api.admin.importTrending(importCount);
      if (result.created + result.updated) {
        toast.success(`Import finished: ${result.created} added, ${result.updated} refreshed`);
      } else {
        toast.info(`Import finished: ${result.skipped} already in the catalogue`);
      }
      await load();
    } catch (importError) {
      toast.error(importError.message);
    } finally {
      setImporting(false);
    }
  };

  const reseed = async () => {
    try {
      const result = await api.admin.seed(true);
      toast.success(`Catalogue reset to the demo data (${result.count} movies)`);
      await load();
    } catch (reseedError) {
      toast.error(reseedError.message);
    }
  };

  if (loading && !movies.length && !error) {
    return (
      <div className="shell section">
        <LoadingBlock label="Loading the admin studio…" />
      </div>
    );
  }

  return (
    <div className="shell section space-y-6">
      <section className="card flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-fog-50 sm:text-2xl">Admin studio</h1>
              <p className="text-sm text-fog-400">
                Signed in as <span className="font-semibold text-fog-200">{user?.displayName || user?.username}</span> ·
                manage the catalogue below
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-ghost" onClick={load} disabled={loading}>
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button type="button" className="btn-primary" onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              Add movie
            </button>
          </div>
        </div>

        {provider && !provider.configured ? (
          <p className="flex items-start gap-2 rounded-2xl border border-accent-500/30 bg-accent-500/10 px-3 py-2.5 text-xs text-accent-400">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              External movie API is not configured yet, so importing is disabled. Add{' '}
              <span className="font-mono">MOVIE_API_KEY</span> and <span className="font-mono">MOVIE_API_BASE_URL</span> to{' '}
              <span className="font-mono">backend/.env</span> to import titles.
            </span>
          </p>
        ) : null}
      </section>

      {stats ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={FilmIcon} label="Movies" value={stats.totalMovies} hint={`${stats.addedLast7Days} added in 7 days`} />
          <StatCard icon={EyeIcon} label="Views" value={compactNumber(stats.totalViews)} tone="sky" hint="Feeds trending" />
          <StatCard icon={HeartIcon} label="Likes" value={compactNumber(stats.totalLikes)} tone="mint" hint="Feeds trending" />
          <StatCard
            icon={StarIcon}
            label="Avg rating"
            value={Number(stats.averageRating || 0).toFixed(1)}
            tone="accent"
            hint={`${stats.upcoming} upcoming · ${stats.archived} archived`}
          />
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-fog-500">
            <CloudDownloadIcon className="h-4 w-4" />
            Import from your movie API
          </h2>
          <p className="mt-2 text-sm text-fog-400">
            Pull a title by its external id, or import the current trending list in bulk. Existing entries are refreshed
            instead of duplicated.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1">
              <span className="field-label">External movie id</span>
              <input
                className="field"
                value={importId}
                onChange={(event) => setImportId(event.target.value)}
                placeholder="e.g. 603"
                disabled={importing || !provider?.configured}
              />
            </label>
            <button type="button" className="btn-primary" onClick={runImport} disabled={importing || !provider?.configured}>
              <PlusIcon className="h-4 w-4" />
              Import
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="min-w-[160px]">
              <span className="field-label">Bulk import trending</span>
              <select
                className="field appearance-none"
                value={importCount}
                onChange={(event) => setImportCount(Number(event.target.value))}
                disabled={importing || !provider?.configured}
              >
                {[3, 5, 10, 15, 20].map((count) => (
                  <option key={count} value={count} className="bg-ink-900">
                    First {count} titles
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-ghost" onClick={runBulkImport} disabled={importing || !provider?.configured}>
              <TrendingUpIcon className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import trending'}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-fog-500">
            <SparklesIcon className="h-4 w-4" />
            Catalogue tools
          </h2>
          <dl className="mt-3 space-y-2 text-xs text-fog-400">
            <div className="flex items-center justify-between gap-3">
              <dt>Provider</dt>
              <dd className="font-mono text-fog-200">{provider?.configured ? 'configured' : 'not configured'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Base URL</dt>
              <dd className="truncate font-mono text-fog-200" title={provider?.baseUrl}>
                {provider?.baseUrl || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Last import</dt>
              <dd className="text-fog-200">{stats?.lastImportAt ? formatDate(stats.lastImportAt.slice(0, 10)) : 'never'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Seeded</dt>
              <dd className="text-fog-200">{stats?.seededAt ? formatDate(stats.seededAt.slice(0, 10)) : 'custom data'}</dd>
            </div>
          </dl>
          <button type="button" className="btn-danger mt-4 w-full" onClick={reseed}>
            <RefreshIcon className="h-4 w-4" />
            Reset to demo catalogue
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <label className="min-w-[220px] flex-1">
            <span className="field-label">Search catalogue</span>
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-500" />
              <input
                type="search"
                className="field pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title, genre, external id…"
              />
            </span>
          </label>
          <label className="min-w-[160px]">
            <span className="field-label">Status</span>
            <select
              className="field appearance-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="" className="bg-ink-900">
                All
              </option>
              <option value="released" className="bg-ink-900">
                Released
              </option>
              <option value="upcoming" className="bg-ink-900">
                Upcoming
              </option>
              <option value="archived" className="bg-ink-900">
                Archived
              </option>
            </select>
          </label>
          <p className="ml-auto text-xs text-fog-500">
            Showing {visible.length} of {movies.length} loaded
          </p>
        </div>

        <AdminMovieTable
          movies={visible}
          sort={sort}
          onSortChange={setSort}
          onEdit={openEdit}
          onDelete={deleteMovie}
          deletingId={deletingId}
          refreshing={loading}
          onRefresh={load}
        />
      </section>

      <Modal
        open={formOpen}
        title={editing ? `Edit “${editing.title}”` : 'Add a new movie'}
        subtitle={editing ? 'Changes are validated by the API before saving' : 'Required fields are marked with an asterisk'}
        onClose={closeForm}
        size="lg"
      >
        <MovieForm
          initialMovie={editing}
          onSubmit={saveMovie}
          onCancel={closeForm}
          busy={saving}
          submitLabel={editing ? 'Save changes' : 'Add movie'}
        />
      </Modal>
      {error ? <ErrorState error={error} onRetry={load} /> : null}
    </div>
  );
}
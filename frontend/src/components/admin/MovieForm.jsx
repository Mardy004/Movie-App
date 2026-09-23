import { useEffect, useState } from 'react';
import { emptyFormValues, toFormValues } from '../../utils/format.js';

const STATUS_OPTIONS = ['released', 'upcoming', 'archived'];

/**
 * Controlled admin form used for both "add movie" and "edit movie".
 * Values stay as strings for inputs and are converted to API types on submit,
 * mirroring the validation the backend performs.
 */
export default function MovieForm({ initialMovie, onSubmit, onCancel, busy, submitLabel = 'Save movie' }) {
  const [values, setValues] = useState(() => (initialMovie ? toFormValues(initialMovie) : emptyFormValues()));

  useEffect(() => {
    setValues(initialMovie ? toFormValues(initialMovie) : emptyFormValues());
  }, [initialMovie]);

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title: values.title.trim(),
      tagline: values.tagline.trim() || null,
      overview: values.overview.trim() || null,
      posterUrl: values.posterUrl.trim() || null,
      backdropUrl: values.backdropUrl.trim() || null,
      trailerUrl: values.trailerUrl.trim() || null,
      videoUrl: values.videoUrl.trim() || null,
      releaseDate: values.releaseDate || null,
      runtimeMinutes: Number(values.runtimeMinutes) || 0,
      genres: values.genres,
      cast: values.cast,
      rating: Number(values.rating) || 0,
      popularity: Number(values.popularity) || 0,
      language: values.language.trim() || 'en',
      status: values.status,
      externalId: values.externalId.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset className="space-y-4" disabled={busy}>
        <legend className="sr-only">Movie identity</legend>
        <div className="grid gap-4 sm:grid-cols-[1.6fr,1fr]">
          <label className="block">
            <span className="field-label">Title *</span>
            <input className="field" value={values.title} onChange={set('title')} placeholder="e.g. Neon Harbour" required minLength={2} />
          </label>
          <label className="block">
            <span className="field-label">Release status</span>
            <select className="field appearance-none" value={values.status} onChange={set('status')}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="bg-ink-900 capitalize">
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="field-label">Tagline</span>
          <input className="field" value={values.tagline} onChange={set('tagline')} placeholder="One line that sells the movie" />
        </label>

        <label className="block">
          <span className="field-label">Overview</span>
          <textarea
            className="field min-h-[110px] resize-y"
            value={values.overview}
            onChange={set('overview')}
            placeholder="Short synopsis shown on the movie page"
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3" disabled={busy}>
        <legend className="sr-only">Release details</legend>
        <label className="block">
          <span className="field-label">Release date</span>
          <input type="date" className="field" value={values.releaseDate} onChange={set('releaseDate')} />
        </label>
        <label className="block">
          <span className="field-label">Runtime (minutes)</span>
          <input type="number" min="0" step="1" className="field" value={values.runtimeMinutes} onChange={set('runtimeMinutes')} />
        </label>
        <label className="block">
          <span className="field-label">Language</span>
          <input className="field" value={values.language} onChange={set('language')} placeholder="en" />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={busy}>
        <legend className="sr-only">Scores</legend>
        <label className="block">
          <span className="field-label">Rating (0 - 10)</span>
          <input type="number" min="0" max="10" step="0.1" className="field" value={values.rating} onChange={set('rating')} />
        </label>
        <label className="block">
          <span className="field-label">Popularity score</span>
          <input type="number" min="0" step="1" className="field" value={values.popularity} onChange={set('popularity')} />
          <span className="field-hint">Feeds the trending ranking along with views and likes.</span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={busy}>
        <legend className="sr-only">Classification</legend>
        <label className="block">
          <span className="field-label">Genres (comma separated)</span>
          <input className="field" value={values.genres} onChange={set('genres')} placeholder="Thriller, Crime" />
        </label>
        <label className="block">
          <span className="field-label">Cast (comma separated)</span>
          <input className="field" value={values.cast} onChange={set('cast')} placeholder="Lead Actor, Supporting Actor" />
        </label>
      </fieldset>

      <fieldset className="space-y-4" disabled={busy}>
        <legend className="sr-only">Media</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Poster URL</span>
            <input className="field" value={values.posterUrl} onChange={set('posterUrl')} placeholder="https://…/poster.jpg" />
          </label>
          <label className="block">
            <span className="field-label">Backdrop URL</span>
            <input className="field" value={values.backdropUrl} onChange={set('backdropUrl')} placeholder="https://…/backdrop.jpg" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Trailer URL</span>
            <input className="field" value={values.trailerUrl} onChange={set('trailerUrl')} placeholder="https://www.youtube.com/watch?v=…" />
          </label>
          <label className="block">
            <span className="field-label">Video URL (full movie file)</span>
            <input className="field" value={values.videoUrl} onChange={set('videoUrl')} placeholder="https://…/movie.mp4" />
            <span className="field-hint">Enables Watch now playback and the Download button.</span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">External API id</span>
            <input className="field" value={values.externalId} onChange={set('externalId')} placeholder="Optional - provider movie id" />
            <span className="field-hint">Used to upsert titles imported from your movie API.</span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
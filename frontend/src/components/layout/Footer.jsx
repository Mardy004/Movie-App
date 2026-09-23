import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../../api/client.js';
import { FilmIcon, MailIcon, ShieldIcon } from '../common/Icons.jsx';

const YEAR = new Date().getFullYear();

/** Local social glyphs (kept here so the shared icon set stays UI-only). */
const SOCIAL_GLYPHS = {
  x: 'M4 4l7.2 9.2L4.4 20h2.4l5.6-5.6L16.6 20H20l-7.4-9.4L19.4 4h-2.4l-5 5-2.9-5H4z',
  github:
    'M12 3a9 9 0 0 0-2.8 17.5c.4.1.6-.2.6-.5v-1.9c-2.4.5-2.9-1.1-2.9-1.1-.3-.9-.8-1.1-.8-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.9-.2-3.4-.9-3.4-4a3.2 3.2 0 0 1 .9-2.2 3 3 0 0 1 .1-2.2s.8-.2 2.5.9a8.4 8.4 0 0 1 4.4 0c1.7-1.1 2.5-.9 2.5-.9.4 1 .1 1.8.1 2.2a3.2 3.2 0 0 1 .9 2.2c0 3.1-1.5 3.8-3.4 4 .3.3.5.8.5 1.5v2.3c0 .3.2.6.6.5A9 9 0 0 0 12 3z',
  youtube:
    'M21 8.4a3 3 0 0 0-2.1-2.1C17.2 5.8 12 5.8 12 5.8s-5.2 0-6.9.5A3 3 0 0 0 3 8.4 22 22 0 0 0 2.6 12a22 22 0 0 0 .4 3.6 3 3 0 0 0 2.1 2.1c1.7.5 6.9.5 6.9.5s5.2 0 6.9-.5a3 3 0 0 0 2.1-2.1 22 22 0 0 0 .4-3.6 22 22 0 0 0-.4-3.6zM10.2 15V9l5.1 3-5.1 3z',
};

const Social = ({ name, href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    aria-label={label}
    title={label}
    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-fog-300 transition hover:border-brand-400/50 hover:bg-brand-500/15 hover:text-fog-50"
  >
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d={SOCIAL_GLYPHS[name]} />
    </svg>
  </a>
);

const ColumnTitle = ({ children }) => (
  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">{children}</h3>
);

const FooterLink = ({ to, children, external }) =>
  external ? (
    <a href={to} className="inline-flex text-sm text-fog-400 transition hover:text-brand-300" target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ) : (
    <Link to={to} className="inline-flex text-sm text-fog-400 transition hover:text-brand-300">
      {children}
    </Link>
  );

export default function Footer() {
  const [genres, setGenres] = useState([]);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.movies.genres().catch(() => []),
      api.meta().then((meta) => meta.provider).catch(() => null),
    ]).then(([genreList, providerInfo]) => {
      if (cancelled) return;
      setGenres(genreList.slice(0, 6));
      setProvider(providerInfo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="mt-12 border-t border-white/5 bg-ink-950/80">
      <div className="shell py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <FilmIcon className="h-5 w-5" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-fog-50">MovieShow</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog-400">
              A movie discovery catalogue with an admin studio. Browse what is trending right now, what landed this week,
              and manage the whole library from one dashboard.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Social name="x" href="https://x.com" label="MovieShow on X" />
              <Social name="github" href="https://github.com" label="MovieShow on GitHub" />
              <Social name="youtube" href="https://youtube.com" label="MovieShow on YouTube" />
            </div>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Discover</ColumnTitle>
            <ul className="space-y-2">
              <li>
                <FooterLink to="/">Home</FooterLink>
              </li>
              <li>
                <FooterLink to="/browse?sort=trending">Trending now</FooterLink>
              </li>
              <li>
                <FooterLink to="/browse?sort=recently-added">Recently added</FooterLink>
              </li>
              <li>
                <FooterLink to="/browse?sort=rating">Top rated</FooterLink>
              </li>
              <li>
                <FooterLink to="/browse?sort=views">Most watched</FooterLink>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>Browse by genre</ColumnTitle>
            {genres.length ? (
              <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {genres.map((genre) => (
                  <li key={genre.slug}>
                    <FooterLink to={`/browse?genre=${encodeURIComponent(genre.name)}`}>
                      {genre.name}
                      <span className="ml-1.5 text-xs text-fog-600">{genre.count}</span>
                    </FooterLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog-500">Genres appear once movies are added.</p>
            )}
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>Catalogue &amp; admin</ColumnTitle>
            <ul className="space-y-2">
              <li>
                <FooterLink to="/admin/login">
                  <span className="inline-flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4" />
                    Admin sign in
                  </span>
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/admin">Admin dashboard</FooterLink>
              </li>
              <li>
                <FooterLink to={`${API_BASE}/api/health`} external>
                  API health check
                </FooterLink>
              </li>
              <li>
                <ProviderHint provider={provider} />
              </li>
            </ul>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-fog-200">
                <MailIcon className="h-4 w-4 text-brand-300" />
                Want a curated list?
              </p>
              <p className="mt-1 text-xs text-fog-500">
                The newsletter block is part of the demo - wire it to your own provider when you go live.
              </p>
            </div>
          </div>
        </div>

        <div className="divider my-8" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">Palette</span>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-fog-400">
              <PaletteSwatch className="bg-brand-500" label="brand" />
              <PaletteSwatch className="bg-accent-500" label="accent" />
              <PaletteSwatch className="bg-coral-500" label="trending" />
              <PaletteSwatch className="bg-mint-500" label="likes" />
              <PaletteSwatch className="bg-sky-500" label="new" />
              <PaletteSwatch className="bg-ink-700" label="surface" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fog-500">
            <span>© {YEAR} MovieShow</span>
            <span className="hidden h-1 w-1 rounded-full bg-fog-600 sm:block" />
            <span>
              Developed by{' '}
              <span className="font-semibold text-fog-300">Mardy</span>
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-fog-600 sm:block" />
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>

        {/* FOOTER-HELPERS */}
      </div>
    </footer>
  );
}

/** Small colour dot + label used by the palette legend. */
function PaletteSwatch({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ring-1 ring-white/20 ${className}`} />
      {label}
    </span>
  );
}

/** Live indicator for the external movie API connection. */
function ProviderHint({ provider }) {
  if (!provider) return <span className="text-sm text-fog-500">Checking API…</span>;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-fog-400">
      <span className={`h-2 w-2 rounded-full ${provider.configured ? 'bg-mint-500' : 'bg-accent-500'}`} />
      {provider.configured ? 'External movie API connected' : 'External movie API not configured'}
    </span>
  );
}
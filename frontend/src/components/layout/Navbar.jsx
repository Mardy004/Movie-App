import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  CloseIcon,
  FilmIcon,
  FlameIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  SunIcon,
  TrendingUpIcon,
} from '../common/Icons.jsx';

/** Navigational groups - keeps the bar from becoming one long row of links. */
const PRIMARY_LINKS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/browse?sort=trending', label: 'Trending', icon: FlameIcon, match: 'trending' },
  { to: '/browse?sort=recently-added', label: 'Recently Added', icon: SparklesIcon, match: 'recently-added' },
  { to: '/browse', label: 'Browse', icon: TrendingUpIcon, match: 'browse' },
];

const linkClass = (isActive) =>
  `inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-brand-500/20 text-fog-50 shadow-glow' : 'text-fog-300 hover:bg-white/5 hover:text-fog-50'
  }`;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer/search whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`/browse?q=${encodeURIComponent(term)}`);
    setQuery('');
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const isBrowseRoute = location.pathname.startsWith('/browse');
  const activeFor = (link) => {
    if (link.end) return location.pathname === '/';
    if (link.match && link.match !== 'browse') return location.search.includes(link.match);
    return isBrowseRoute && !location.search.includes('trending') && !location.search.includes('recently-added');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl transition ${
        scrolled ? 'bg-ink-950/90 shadow-nav' : 'bg-ink-950/70'
      }`}
    >
      <div className="shell flex h-16 items-center gap-3 sm:h-[68px]">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="MovieShow home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <FilmIcon className="h-5 w-5" />
          </span>
          <span className="hidden flex-col leading-none xs:flex">
            <span className="text-base font-extrabold tracking-tight text-fog-50">MovieShow</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">Catalogue</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} end={link.end} className={linkClass(activeFor(link))}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <form onSubmit={submitSearch} className="hidden items-center md:flex">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies, genres, cast…"
              aria-label="Search movies"
              className="field h-11 w-56 rounded-2xl pl-9 pr-3 lg:w-64 xl:w-72"
            />
          </div>
        </form>

        <button
          type="button"
          className="icon-btn md:hidden"
          onClick={() => setSearchOpen((open) => !open)}
          aria-label={searchOpen ? 'Close search' : 'Open search'}
          aria-expanded={searchOpen}
        >
          {searchOpen ? <CloseIcon className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
        </button>

        {/* dark / light theme switch - available at every breakpoint */}
        <button
          type="button"
          className="icon-btn shrink-0"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>

        {/* <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Link to="/admin" className="btn-ghost btn-sm">
                <ShieldIcon className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-gradient text-[11px] font-bold text-white">
                  {(user?.displayName || user?.username || 'AD').slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-fog-200">{user?.displayName || user?.username}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg p-1 text-fog-400 transition hover:text-coral-400"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogoutIcon className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link to="/admin/login" className="btn-primary btn-sm">
              <ShieldIcon className="h-4 w-4" />
              Admin sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="icon-btn lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>*/}
      </div> 

      {searchOpen ? (
        <div className="border-t border-white/5 bg-ink-950/95 px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog-500" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search movies…"
                aria-label="Search movies"
                className="field pl-9"
              />
            </div>
            <button type="submit" className="btn-primary">
              Go
            </button>
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <MobileDrawer isAuthenticated={isAuthenticated} user={user} onLogout={logout} theme={theme} onToggleTheme={toggleTheme} />
      ) : null}
    </header>
  );
}

/** Collapsible navigation for small screens - grouped into labelled sections. */
function MobileDrawer({ isAuthenticated, user, onLogout, theme, onToggleTheme }) {
  return (
    <div className="border-t border-white/5 bg-ink-950 pb-4 shadow-nav lg:hidden">
      <div className="shell space-y-4 pt-4">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">Appearance</p>
          <button type="button" className="btn-ghost w-full justify-start" onClick={onToggleTheme}>
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">Discover</p>
          <div className="grid grid-cols-2 gap-2">
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="btn-ghost justify-start">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">Collections</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/browse?sort=rating" className="btn-ghost justify-start">
              Top rated
            </Link>
            <Link to="/browse?sort=views" className="btn-ghost justify-start">
              Most watched
            </Link>
            <Link to="/browse?status=upcoming" className="btn-ghost justify-start">
              Upcoming
            </Link>
            <Link to="/browse?sort=title" className="btn-ghost justify-start">
              A - Z
            </Link>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fog-500">Admin</p>
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/admin" className="btn-primary w-full">
                <ShieldIcon className="h-4 w-4" />
                Open dashboard
              </Link>
              <button type="button" className="btn-ghost w-full" onClick={onLogout}>
                <LogoutIcon className="h-4 w-4" />
                Sign out ({user?.username})
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="btn-primary w-full">
              <ShieldIcon className="h-4 w-4" />
              Admin sign in
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { FilmIcon, HomeIcon, SearchIcon } from '../components/common/Icons.jsx';

/** Friendly 404 with shortcuts back into the catalogue. */
export default function NotFound() {
  const location = useLocation();

  return (
    <div className="shell section">
      <div className="empty-state mx-auto max-w-xl">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/15 text-brand-300">
          <FilmIcon className="h-8 w-8" />
        </span>
        <p className="text-4xl font-extrabold text-fog-50">404</p>
        <h1 className="text-lg font-semibold text-fog-50">That screen is not in the catalogue</h1>
        <p className="text-sm text-fog-400">
          Nothing is mapped to <span className="font-mono text-brand-300">{location.pathname}</span>. Try the home screen or
          search the library instead.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            <HomeIcon className="h-4 w-4" />
            Back home
          </Link>
          <Link to="/browse" className="btn-ghost">
            <SearchIcon className="h-4 w-4" />
            Browse movies
          </Link>
        </div>
      </div>
    </div>
  );
}
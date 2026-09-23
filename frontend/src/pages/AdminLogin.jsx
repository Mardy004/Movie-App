import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { AlertIcon, FilmIcon, LockIcon, ShieldIcon, SparklesIcon, UsersIcon } from '../components/common/Icons.jsx';

/** Admin sign-in screen. Credentials come from backend/.env (admin / admin123 by default). */
export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(username.trim(), password);
      toast.success(`Welcome back, ${user.displayName || user.username}`);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError);
      toast.error(loginError.message);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div className="shell section">
      <div className="grid gap-6 lg:grid-cols-[1fr,420px] lg:items-stretch">
        <section className="card relative hidden overflow-hidden p-7 lg:block">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative space-y-5">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
              <ShieldIcon className="h-4 w-4" />
              Admin studio
            </span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fog-50">
              One dashboard for the whole movie catalogue
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-fog-400">
              Add new titles, edit anything already published, retire what has left cinemas, and keep an eye on what is
              trending. Sign in to unlock the write endpoints of the API.
            </p>
            <ul className="space-y-3 text-sm text-fog-300">
              <li className="flex items-start gap-3">
                <FilmIcon className="mt-0.5 h-4 w-4 text-brand-300" />
                Create, update and delete movies with instant validation feedback.
              </li>
              <li className="flex items-start gap-3">
                <SparklesIcon className="mt-0.5 h-4 w-4 text-accent-400" />
                Import titles straight from your own movie API by external id.
              </li>
              <li className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 h-4 w-4 text-mint-400" />
                Watch views and likes push titles up the trending ranking.
              </li>
            </ul>
            <p className="text-xs text-fog-500">
              Sessions are signed tokens kept in this browser only - sign out any time from the navbar.
            </p>
          </div>
        </section>

        <section className="card p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
              <LockIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-fog-50">Admin sign in</h2>
              <p className="text-xs text-fog-400">Use the credentials configured in backend/.env</p>
            </div>
          </div>
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-coral-500/40 bg-coral-500/10 px-3 py-2.5 text-sm text-coral-400">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {error.message}
                {Array.isArray(error.details) && error.details.length ? (
                  <span className="block text-xs">{error.details.join(', ')}</span>
                ) : null}
              </span>
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="block">
              <span className="field-label">Username</span>
              <input
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <input
                type="password"
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={busy || !username || !password}>
              <ShieldIcon className="h-4 w-4" />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>

            <button type="button" className="btn-ghost w-full" onClick={fillDemo} disabled={busy}>
              Use demo credentials
            </button>
          </form>

          <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-fog-400">
            <p className="font-semibold text-fog-200">Default development account</p>
            <p>
              username <span className="font-mono text-brand-300">admin</span> · password{' '}
              <span className="font-mono text-brand-300">admin123</span>
            </p>
            <p className="text-fog-500">Change ADMIN_USERNAME / ADMIN_PASSWORD in backend/.env before deploying.</p>
          </div>

          <p className="mt-4 text-center text-xs text-fog-500">
            Just browsing?{' '}
            <Link to="/" className="font-semibold text-brand-300 hover:text-brand-400">
              Back to the catalogue
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
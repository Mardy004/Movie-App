import { NavLink, useLocation } from 'react-router-dom';
import { FilmIcon, FlameIcon, HomeIcon, ShieldIcon, SparklesIcon } from '../common/Icons.jsx';

/**
 * Mobile bottom tab bar (native app pattern). Hidden from md upwards, where the
 * navbar carries the same destinations.
 */
const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, match: 'home' },
  { to: '/browse?sort=trending', label: 'Trending', icon: FlameIcon, match: 'trending' },
  { to: '/browse?sort=recently-added', label: 'New', icon: SparklesIcon, match: 'recently-added' },
  { to: '/browse', label: 'Browse', icon: FilmIcon, match: 'browse' },
  { to: '/admin', label: 'Admin', icon: ShieldIcon, match: 'admin' },
];

export default function BottomTabBar() {
  const location = useLocation();

  const isActive = (tab) => {
    if (tab.match === 'admin') return location.pathname.startsWith('/admin');
    if (tab.match === 'home') return location.pathname === '/';
    if (tab.match === 'browse') {
      return (
        location.pathname.startsWith('/browse') &&
        !location.search.includes('trending') &&
        !location.search.includes('recently-added')
      );
    }
    return location.pathname.startsWith('/browse') && location.search.includes(tab.match);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink-950/95 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-stretch justify-between px-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition ${
                active ? 'text-brand-300' : 'text-fog-500'
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-2xl transition ${
                  active ? 'bg-brand-500/20 text-brand-300 shadow-glow' : 'bg-white/5 text-fog-400'
                }`}
              >
                <tab.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" filled={false} />
              </span>
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
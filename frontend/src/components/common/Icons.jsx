/**
 * Inline SVG icon set (no icon dependency).
 * Every icon inherits `currentColor`, so it follows the palette automatically.
 */
const Svg = ({ children, className = 'h-5 w-5', filled = false, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const ChatIcon = (props) => (
  <Svg {...props}>
    <path d="M4 5.5h16v10H10.8L6.5 19.4v-3.9H4z" />
  </Svg>
);

export const ReplyIcon = (props) => (
  <Svg {...props}>
    <path d="M9.5 14.5 4.5 9.8 9.5 5" />
    <path d="M4.5 9.8h9a6 6 0 0 1 0 12h-2" />
  </Svg>
);

export const FilmIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7.5 3v18M16.5 3v18M3 8.5h4.5M3 15.5h4.5M16.5 8.5H21M16.5 15.5H21" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const FlameIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3c2.6 3 4.6 5.2 4.6 8.2A4.6 4.6 0 0 1 12 15.8a4.6 4.6 0 0 1-4.6-4.6c0-1.3.5-2.5 1.3-3.5.3 1.1.9 1.8 1.7 2.1-.7-2.6-.3-5.1.9-7.2z" />
    <path d="M8.6 16.4c.9 1 2.1 1.6 3.4 1.6s2.5-.6 3.4-1.6c.5 2.2-1.4 4.1-3.4 4.1s-3.9-1.9-3.4-4.1z" />
  </Svg>
);

export const SparklesIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3l1.6 4.3L18 9l-4.4 1.7L12 15l-1.6-4.3L6 9l4.4-1.7z" />
    <path d="M17.5 15.5l.8 2.1 2.2.9-2.2.9-.8 2.1-.8-2.1-2.2-.9 2.2-.9z" />
  </Svg>
);

export const StarIcon = (props) => (
  <Svg {...props}>
    <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.8l5.9-.9z" />
  </Svg>
);

export const HeartIcon = (props) => (
  <Svg {...props}>
    <path d="M12 20s-7.2-4.4-7.2-9.4A4.2 4.2 0 0 1 12 7.9a4.2 4.2 0 0 1 7.2 2.7c0 5-7.2 9.4-7.2 9.4z" />
  </Svg>
);

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const PlayIcon = (props) => (
  <Svg {...props}>
    <path d="M8 5.6v12.8L19 12z" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const PencilIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20h4L18.5 9.5l-4-4L4 16z" />
    <path d="m14 6 4 4" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7 7.6 20h8.8L17.5 7" />
  </Svg>
);

export const CloudDownloadIcon = (props) => (
  <Svg {...props}>
    <path d="M7.5 17.5H6.2a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.8 1.5 3.6 3.6 0 0 1 1.2 6.9h-1.3" />
    <path d="M12 12v8m0 0-2.6-2.6M12 20l2.6-2.6" />
  </Svg>
);

export const ShieldIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3l7 3v6c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const LogoutIcon = (props) => (
  <Svg {...props}>
    <path d="M15 12H4.5m0 0L8 8.5M4.5 12 8 15.5" />
    <path d="M12 4h4.5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H12" />
  </Svg>
);

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);

export const RefreshIcon = (props) => (
  <Svg {...props}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v4.5h-4.5" />
  </Svg>
);

export const LockIcon = (props) => (
  <Svg {...props}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.2a4 4 0 0 1 8 0V10" />
  </Svg>
);

export const MailIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 7 8.2 6 8.2-6" />
  </Svg>
);

export const HomeIcon = (props) => (
  <Svg {...props}>
    <path d="m4 11 8-7 8 7v8a1.3 1.3 0 0 1-1.3 1.3H5.3A1.3 1.3 0 0 1 4 19z" />
    <path d="M10 20.3v-5.8h4v5.8" />
  </Svg>
);

export const ClockIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.2 2" />
  </Svg>
);

export const CalendarIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m5 13 4.5 4.5L19 6.5" />
  </Svg>
);

export const AlertIcon = (props) => (
  <Svg {...props}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Svg>
);

export const UsersIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M5.6 19.2a6.4 6.4 0 0 1 12.8 0" />
  </Svg>
);

export const TagIcon = (props) => (
  <Svg {...props}>
    <path d="M11 4H5v6l9 9 6-6z" />
    <circle cx="8" cy="7" r="1.2" />
  </Svg>
);

export const FilterIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </Svg>
);

export const SunIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
  </Svg>
);

export const MoonIcon = (props) => (
  <Svg {...props}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />
  </Svg>
);

export const TrendingUpIcon = (props) => (
  <Svg {...props}>
    <path d="M4 17l5-5 3 3 6.5-7" />
    <path d="M14.5 8H19v4.5" />
  </Svg>
);

export default {
  FilmIcon,
  SearchIcon,
  MenuIcon,
  CloseIcon,
  FlameIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  EyeIcon,
  PlayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CloudDownloadIcon,
  ShieldIcon,
  LogoutIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  RefreshIcon,
  LockIcon,
  MailIcon,
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  CheckIcon,
  AlertIcon,
  UsersIcon,
  TagIcon,
  FilterIcon,
  TrendingUpIcon,
};

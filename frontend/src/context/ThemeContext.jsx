import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'movieshow.theme';

/**
 * Theme switcher (dark "Nocturne" is the default, light "Daylight" is opt-in).
 * The choice is written to localStorage and applied by setting data-theme on
 * <html>, which index.css uses to re-skin the whole app.
 */
const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, setTheme: () => {} });

const readInitialTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* private mode - fall through to the dark default */
  }
  return 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable - theme still applies for this session */
    }
    // Keep the browser chrome (mobile URL bar) in sync with the theme.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f6fc' : '#050817');
  }, [theme]);

  const toggle = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
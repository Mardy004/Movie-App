import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { session } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Admin session store. Nothing is persisted - every page load starts as a
 * guest, so the admin signs in again on each visit.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('guest');

  useEffect(() => {
    let cancelled = false;
    if (!session.getToken()) {
      setStatus('guest');
      return () => {
        cancelled = true;
      };
    }
    setStatus('checking');
    api.auth
      .session()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        session.clear();
        setToken('');
        setUser(null);
        setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (username, password) => {
    const data = await api.auth.login(username, password);
    session.save(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* logging out locally is enough even if the server is unreachable */
    }
    session.clear();
    setToken('');
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      isAuthenticated: status === 'authenticated',
      isChecking: status === 'checking',
      login,
      logout,
    }),
    [user, token, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;

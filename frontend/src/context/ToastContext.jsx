import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

const TONES = {
  success: 'border-mint-500/40 bg-mint-500/15 text-mint-400',
  error: 'border-coral-500/40 bg-coral-500/15 text-coral-400',
  info: 'border-sky-500/40 bg-sky-500/15 text-sky-400',
  warning: 'border-accent-500/40 bg-accent-500/15 text-accent-400',
};

/** Lightweight toast stack (no dependency) used for CRUD + import feedback. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { tone = 'info', duration = 4200 } = {}) => {
      const id = nextId;
      nextId += 1;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }
      return id;
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      push,
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      error: (message, options) => push(message, { ...options, tone: 'error', duration: 6000 }),
      info: (message, options) => push(message, { ...options, tone: 'info' }),
      warning: (message, options) => push(message, { ...options, tone: 'warning' }),
    }),
    [toasts, dismiss, push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto w-full max-w-sm animate-fade-up rounded-2xl border px-4 py-3 text-left text-sm font-medium shadow-card backdrop-blur ${
              TONES[toast.tone] || TONES.info
            }`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

export default ToastContext;

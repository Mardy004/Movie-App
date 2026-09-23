import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons.jsx';

/** Accessible modal shell (portal + Escape + scroll lock). */
export default function Modal({ open, title, subtitle, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl border border-white/10 bg-ink-900 shadow-card sm:rounded-4xl ${
          widths[size] || widths.md
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-fog-50 sm:text-lg">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-fog-400">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn h-9 w-9" onClick={onClose} aria-label="Close">
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="border-t border-white/5 bg-ink-950/50 px-5 py-3">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

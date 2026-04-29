import { useEffect, useRef } from 'react';
import { Icons } from './Icons.jsx';

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const TAB_META = {
  today: { title: "Today's Training", icon: Icons.clock, label: 'Today' },
  history: { title: 'History', icon: Icons.calendar, label: 'History' },
  nutrition: { title: 'Nutrition', icon: Icons.coffee, label: 'Food' },
  progress: { title: 'Progress', icon: Icons.activity, label: 'Progress' },
  settings: { title: 'Settings', icon: Icons.settings, label: 'Settings' }
};

export function AppShell({ tab, setTab, theme, subtitle, syncStatus = 'offline', signedIn = false, leadingIcon, onSyncClick, children }) {
  useEffect(() => {
    document.body.setAttribute('data-app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const meta = TAB_META[tab];
  const syncClass =
    !signedIn ? 'off' : syncStatus === 'connected' ? '' : syncStatus === 'syncing' ? 'syncing' : 'off';
  const syncLabel = !signedIn
    ? 'Local'
    : syncStatus === 'connected'
      ? 'Synced'
      : syncStatus === 'syncing'
        ? 'Syncing…'
        : 'Offline';
  const syncTitle = !signedIn
    ? 'Sign in to sync across devices'
    : syncStatus === 'connected'
      ? 'Synced to cloud'
      : syncStatus === 'syncing'
        ? 'Syncing to cloud…'
        : 'Offline — changes stored locally';

  return (
    <div className="tt-app" data-theme={theme}>
      <div className="tt-header">
        {leadingIcon && <div className="tt-mark">{leadingIcon}</div>}
        <div style={{ flex: 1 }}>
          <div className="tt-title">{meta.title}</div>
          {subtitle && <div className="tt-sub">{subtitle}</div>}
        </div>
        {onSyncClick ? (
          <button
            type="button"
            className={`tt-sync ${syncClass}`}
            onClick={onSyncClick}
            title={syncTitle}
            aria-label={syncTitle}
          >
            <span className="dot" />
            {syncLabel}
          </button>
        ) : (
          <div className={`tt-sync ${syncClass}`} title={syncTitle}>
            <span className="dot" />
            {syncLabel}
          </div>
        )}
      </div>

      {children}

      <nav className="tt-nav" role="tablist">
        {Object.entries(TAB_META).map(([k, m]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={`tt-nb ${tab === k ? 'on' : ''}`}
            onClick={() => setTab(k)}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Page({ children, className = '' }) {
  return <div className={`tt-page tt-page-enter ${className}`}>{children}</div>;
}

export function Card({ children, className = '', title, trailing }) {
  return (
    <div className={`tt-card ${className}`}>
      {(title || trailing) && (
        <div className="tt-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1 }}>{title}</span>
          {trailing}
        </div>
      )}
      {children}
    </div>
  );
}

export function OpaqueCard({ children, className = '' }) {
  return <div className={`tt-card-opaque ${className}`}>{children}</div>;
}

export function Modal({ open, onClose, title, children, centered = false }) {
  const modalRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;

    const focusables = () =>
      modalRef.current ? Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)) : [];

    // Focus the first focusable element (or the modal itself) when it opens.
    const first = focusables()[0];
    if (first) first.focus();
    else if (modalRef.current) modalRef.current.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const el = returnFocusRef.current;
      if (el && typeof el.focus === 'function') el.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="tt-modal-scrim"
      style={centered ? { alignItems: 'center', padding: '0 16px' } : undefined}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="tt-modal"
        style={centered ? { borderRadius: 24, width: '100%', padding: 22 } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {!centered && <div className="tt-modal-handle" />}
        {title && (
          <div className="tt-modal-hd">
            <h3>{title}</h3>
            <button className="tt-btn tt-btn-ghost tt-btn-sm" onClick={onClose} aria-label="Close">
              {Icons.close}
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div className="tt-seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
          role="tab"
          aria-selected={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tag({ kind = 'sport', children, icon }) {
  return (
    <span className={`tt-tag tt-tag-${kind}`}>
      {icon && <span className="tt-tag-ico">{icon}</span>}
      {children}
    </span>
  );
}

export function Banner({ kind = 'check', children, onDismiss, icon }) {
  return (
    <div className={`tt-banner tt-banner-${kind}`}>
      {icon && <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>}
      <div className="sp">{children}</div>
      {onDismiss && <button className="x" onClick={onDismiss} aria-label="Dismiss">×</button>}
    </div>
  );
}

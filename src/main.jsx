import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './colors_and_type.css';
import './kit/shell-styles.css';
import { App } from './App.jsx';
import { StoreProvider } from './store/StoreProvider.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed', error, info);
  }
  reset = () => {
    try {
      localStorage.removeItem('training_tracker_v2');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      }
      if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
    } catch {}
    setTimeout(() => window.location.reload(), 200);
  };
  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error?.stack || this.state.error?.message || String(this.state.error);
    return (
      <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '20px auto', color: '#111' }}>
        <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
        <p>The app hit an error during startup. The details below will help us fix it.</p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: 12, borderRadius: 8, fontSize: 12, maxHeight: 240, overflow: 'auto' }}>
          {msg}
        </pre>
        <button
          onClick={this.reset}
          style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#b26a45', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Reset local data and reload
        </button>
        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          This clears local cache and the service worker. Cloud-synced data is unaffected.
        </p>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  });
}

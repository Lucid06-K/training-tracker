import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './colors_and_type.css';
import './kit/shell-styles.css';
import { App } from './App.jsx';
import { StoreProvider } from './store/StoreProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

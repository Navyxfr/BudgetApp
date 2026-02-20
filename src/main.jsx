import './storage.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const PRELOAD_RELOAD_TS_KEY = 'bp-preload-reload-ts';
const PRELOAD_RELOAD_COOLDOWN_MS = 30_000;

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const lastReloadTs = Number(sessionStorage.getItem(PRELOAD_RELOAD_TS_KEY) || 0);
  const now = Date.now();
  if (now - lastReloadTs < PRELOAD_RELOAD_COOLDOWN_MS) return;
  sessionStorage.setItem(PRELOAD_RELOAD_TS_KEY, String(now));

  const reload = () => window.location.reload();
  if (!('serviceWorker' in navigator)) {
    reload();
    return;
  }

  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((reg) => reg.update().catch(() => null))))
    .finally(reload);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

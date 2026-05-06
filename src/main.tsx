import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {
    // Service worker registration is optional for local development.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerServiceWorker();

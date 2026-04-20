import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const register = () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const ric = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
    if (typeof ric === 'function') {
      ric(register, { timeout: 3000 });
    } else {
      setTimeout(register, 0);
    }
  });
}

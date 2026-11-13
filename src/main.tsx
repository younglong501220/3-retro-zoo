import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const mountEl = document.getElementById('analytics-root') || document.getElementById('root');
if (mountEl) {
  createRoot(mountEl).render(<App />);
}

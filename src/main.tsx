import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// The liquid-glass refraction redraws an SVG displacement filter on every scroll frame. Desktop GPUs handle it;
// phones get the plain frosted blur instead (touch screens report no hover and a coarse pointer).
const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
if (brands?.some((entry) => entry.brand === 'Chromium') && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.documentElement.classList.add('refract');
}

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The page arrives already rendered, so let the browser paint it first and only then attach React (on a slow
// phone, hydrating straight away held the first paint back until the script had run).
if (root.hasChildNodes()) requestAnimationFrame(() => setTimeout(() => hydrateRoot(root, app), 0));
else createRoot(root).render(app);

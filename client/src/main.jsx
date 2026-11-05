import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Storefront from './Storefront.jsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemen root aplikasi tidak ditemukan.');
}

createRoot(rootElement).render(
  <StrictMode>
    <Storefront />
  </StrictMode>,
);

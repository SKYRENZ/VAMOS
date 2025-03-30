import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

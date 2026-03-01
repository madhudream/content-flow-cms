import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentFlowSDK } from '@contentflow/sdk';
import { initCMSMode } from './services/cmsMode';
import './index.css';
import App from './App.tsx';

// Initialize SDK before rendering
await ContentFlowSDK.initialize({
  appId: 'bwo-taxforms',
  language: 'en-US',
  storageUrl: '/api/content',
  pages: ['home', 'personal-info', 'income'],
});

// Initialize CMS mode if ?cms-mode=true
initCMSMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

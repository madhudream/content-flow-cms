import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentFlowSDK } from '@contentflow/sdk';
import '@contentflow/sdk/webcomponent'; // Register web components
import { initCMSMode } from './services/cmsMode';
import { getPersistedLanguage } from './components/LanguageSelector';
import './index.css';
import App from './App.tsx';

// Load persisted language or default to English
const persistedLanguage = getPersistedLanguage();

// Initialize SDK before rendering
await ContentFlowSDK.initialize({
  appId: 'bwo-taxforms',
  language: persistedLanguage,
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

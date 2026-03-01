import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ContentFlowSDK } from '@contentflow/sdk'
import { enableCMSMode } from './services/cmsMode'
import { getPersistedLanguage } from './components/LanguageSelector'

// Load persisted language or default to English
const persistedLanguage = getPersistedLanguage();

// Initialize ContentFlow SDK
await ContentFlowSDK.initialize({
  appId: 'customer-portal',
  language: persistedLanguage,
  storageUrl: '/api/content',
  pages: ['home', 'about', 'customers'],
});

// Enable CMS mode if query param present
if (new URLSearchParams(window.location.search).get('cms-mode') === 'true') {
  enableCMSMode();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

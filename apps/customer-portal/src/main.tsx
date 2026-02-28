import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ContentFlowSDK } from '@contentflow/sdk'
import { enableCMSMode } from './services/cmsMode'

// Initialize ContentFlow SDK
await ContentFlowSDK.initialize({
  appId: 'customer-portal',
  language: 'en-US',
  storageUrl: 'http://localhost:3010/api/content',
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

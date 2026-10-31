import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Imported before the app so UTM/referrer are captured before URL sync rewrites location.search.
import { initEmbedBridge } from './lead/embed';
import './lead/source';
import './index.css';
import App, { isEmbed } from './App.tsx';

if (isEmbed) document.documentElement.classList.add('is-embed');
// Posts {type:'99p:height'} to the parent page (ResizeObserver) and receives HubSpot hutk.
initEmbedBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

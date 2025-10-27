import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setOptions } from '@googlemaps/js-api-loader'
import './index.css'
import App from './App.tsx'

// 全域設定 Google Maps API
setOptions({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_JS_KEY,
  version: 'weekly'
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

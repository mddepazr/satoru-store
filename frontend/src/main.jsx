import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Monta la aplicación React dentro del elemento root de index.html.
// StrictMode agrega comprobaciones de desarrollo, incluida la limpieza de efectos.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

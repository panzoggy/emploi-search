import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import '@fontsource-variable/archivo'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import { App } from './app/App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable dans index.html')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: '!rounded-none !bg-surface !text-fg !text-sm !border !border-rule-strong !shadow-none',
          success: { iconTheme: { primary: 'rgb(var(--success))', secondary: 'rgb(var(--bg))' } },
          error: { iconTheme: { primary: 'rgb(var(--danger))', secondary: 'rgb(var(--bg))' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)

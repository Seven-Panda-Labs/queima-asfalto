import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { DisciplinesProvider } from './contexts/DisciplinesContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { initI18n } from './i18n/index.ts'
import './services/firebase.ts'
import './styles/globals.css'

registerSW({ immediate: true })

void initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <DisciplinesProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </DisciplinesProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})

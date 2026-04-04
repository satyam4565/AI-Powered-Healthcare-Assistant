import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'

import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: "dark:bg-slate-800 dark:text-white dark:border-slate-700 bg-white text-slate-800 border-slate-200 border",
              style: {
                background: 'inherit',
                color: 'inherit',
              }
            }} 
          />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
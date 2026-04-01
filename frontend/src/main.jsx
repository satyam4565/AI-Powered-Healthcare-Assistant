import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
          }} 
        />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>,
)
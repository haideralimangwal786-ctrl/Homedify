import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import CustomToast from './components/CustomToast'

import { App as AntApp, ConfigProvider } from 'antd'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={clientId}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          colorLink: '#FF6B6B',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
    <Toaster
      position="top-right"
      containerStyle={{ top: '80px', right: '30px' }}
      toastOptions={{
        duration: 3000,
        style: { background: 'transparent', boxShadow: 'none' },
      }}
      children={(t) => {
        const type = t.type === 'success' ? 'success' : t.type === 'error' ? 'error' : 'info'
        return (
          <div
            style={{
              animation: t.visible
                ? 'slideDown 0.3s ease-out forwards'
                : 'slideUp 0.3s ease-in forwards'
            }}
          >
            <CustomToast
              type={type}
              message={typeof t.message === 'string' ? t.message : t.message}
              duration={t.duration || 3000}
              toastId={t.id}
            />
          </div>
        )
      }}
    />
    <style>{`
      @keyframes slideDown {
        from { transform: translateY(-100px); opacity: 0; }
        to   { transform: translateY(0);      opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(0);      opacity: 1; }
        to   { transform: translateY(-100px); opacity: 0; }
      }
    `}</style>
  </GoogleOAuthProvider>
)

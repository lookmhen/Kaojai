import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { I18nProvider } from './context/I18nContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SocketProvider>
        <App />
      </SocketProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

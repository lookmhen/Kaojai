import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';

const logger = createLogger();
const originalLoggerError = logger.error;

logger.error = (msg, options) => {
  if (
    options?.error?.code === 'ECONNABORTED' ||
    options?.error?.code === 'ECONNRESET' ||
    msg.includes('ECONNABORTED') ||
    msg.includes('ECONNRESET') ||
    (msg.includes('ws proxy socket error') && (msg.includes('ECONNABORTED') || msg.includes('ECONNRESET')))
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
            console.error('[Vite Proxy Error]:', err.message);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
            });
          });
        }
      }
    }
  }
});

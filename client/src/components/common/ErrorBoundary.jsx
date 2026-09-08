import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'var(--bg-cream, #FDFBF7)',
          fontFamily: 'Prompt, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #F1F5F9'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#FEE2E2',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={32} color="#DC2626" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
              ขออภัย เกิดข้อผิดพลาดบางอย่าง
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              ระบบพบข้อผิดพลาดที่ไม่คาดคิดในหน้านี้ ท่านสามารถกดรีเฟรชเพื่อโหลดข้อมูลใหม่อีกครั้ง
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: 'var(--accent-earth-blue, #1E3A8A)',
                color: '#FFFFFF',
                borderRadius: '50px',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)'
              }}
            >
              <RefreshCw size={18} /> โหลดหน้านี้ใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

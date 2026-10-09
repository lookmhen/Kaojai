import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, GraduationCap, X, AlertCircle, Loader2, Sparkles, KeyRound } from 'lucide-react';

export const AdminLoginModal = ({ isOpen, onClose, onSuccess, redirectLabel = '' }) => {
  const { login, isAuthenticated, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
      setShowPassword(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handlePerformLogin = async (userToLogin, passToLogin) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await login(userToLogin, passToLogin);
      if (res.success) {
        if (onSuccess) {
          onSuccess(res.user);
        }
        onClose();
      } else {
        setError(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้งาน (Username)');
      return;
    }
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }
    handlePerformLogin(username, password);
  };

  const handleQuickDemoLogin = (role) => {
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin1234');
      handlePerformLogin('admin', 'admin1234');
    } else {
      setUsername('teacher');
      setPassword('teacher1234');
      handlePerformLogin('teacher', 'teacher1234');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="glass-card animate-pop"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          position: 'relative',
          border: '1px solid #E2E8F0',
          borderTop: '6px solid var(--accent-earth-blue, #1E3A8A)'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#F1F5F9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#EFF6FF',
              color: '#1E40AF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '12px',
              border: '1px solid #DBEAFE'
            }}
          >
            <KeyRound size={14} /> Teacher & Admin Portal
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main, #1E293B)', margin: '0 0 6px 0' }}>
            เข้าสู่ระบบ KaoJai
          </h2>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>
            {redirectLabel ? (
              <span>ต้องเข้าสู่ระบบก่อนดำเนินการ: <strong style={{ color: 'var(--accent-earth-blue, #1E3A8A)' }}>{redirectLabel}</strong></span>
            ) : (
              'เข้าถึงระบบจัดการคลังข้อสอบและเครื่องมือผู้สอน'
            )}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#991B1B',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1E293B)', marginBottom: '6px' }}>
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="กรอก Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: 'var(--text-main, #1E293B)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1E293B)', marginBottom: '6px' }}>
              รหัสผ่าน (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="กรอก Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: 'var(--text-main, #1E293B)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '4px',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 800,
              border: 'none',
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.3)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> กำลังตรวจสอบข้อมูล...
              </>
            ) : (
              'เข้าสู่ระบบ (Sign In)'
            )}
          </button>
        </form>

        {/* Quick Demo 1-Click Login Section */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            <Sparkles size={14} color="#D97706" /> เข้าสู่ระบบด่วนสำหรับการทดสอบ (Demo 1-Click)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ADMIN')}
              disabled={isLoading}
              style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '12px',
                padding: '10px 8px',
                textAlign: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#166534', fontWeight: 800, fontSize: '0.85rem' }}>
                <ShieldCheck size={16} /> Admin
              </div>
              <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '2px', fontWeight: 600 }}>
                admin / admin1234
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('TEACHER')}
              disabled={isLoading}
              style={{
                background: '#EFF6FF',
                border: '1.5px solid #93C5FD',
                borderRadius: '12px',
                padding: '10px 8px',
                textAlign: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#1E40AF', fontWeight: 800, fontSize: '0.85rem' }}>
                <GraduationCap size={16} /> อาจารย์ (Teacher)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '2px', fontWeight: 600 }}>
                teacher / teacher1234
              </div>
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', marginTop: '14px', marginBottom: 0 }}>
            💡 Model 2-Tier: Admin จัดการผู้ใช้งานได้ | Teacher จัดการคลังข้อสอบและเปิดห้องได้
          </p>
        </div>
      </div>
    </div>
  );
};

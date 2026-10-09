import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker, getRandomAvatar } from './AvatarPicker';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Gift, Trophy, Sparkles, CheckCircle2, User, RefreshCw, AlertCircle, Lock, Unlock } from 'lucide-react';

export const LuckyDrawPlayerJoin = ({ initialPin = '' }) => {
  const { socket, isConnected } = useSocket();

  const urlParams = new URLSearchParams(window.location.search);
  const targetPin = (initialPin || urlParams.get('pin') || '').trim();

  const storageKey = `kaojai_luckydraw_registered_${targetPin}`;
  const [savedData, setSavedData] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [name, setName] = useState(() => savedData?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => savedData?.avatar || getRandomAvatar());
  const [isRegistered, setIsRegistered] = useState(Boolean(savedData?.isRegistered));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);

  // Real-time registration lock listener and initial status fetch
  useEffect(() => {
    if (!socket || !targetPin) return;

    socket.emit('get_luckydraw_status', { pin: targetPin }, (res) => {
      if (res && typeof res.isLocked === 'boolean') {
        setIsRegistrationLocked(res.isLocked);
      }
    });

    const handleLockUpdated = (data) => {
      if (data && typeof data.isLocked === 'boolean') {
        setIsRegistrationLocked(data.isLocked);
      }
    };

    socket.on('luckydraw_lock_updated', handleLockUpdated);
    return () => {
      socket.off('luckydraw_lock_updated', handleLockUpdated);
    };
  }, [socket, targetPin]);

  // Real-time winner announcement state
  const [winResult, setWinResult] = useState(null); // { isMe: boolean, winnerName: string, prizeName: string }
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // If already registered, ensure joined to socket room on mount / reconnect
  useEffect(() => {
    if (!socket || !targetPin || !isRegistered || !savedData?.playerId) return;

    socket.emit('join_room', {
      pin: targetPin,
      name: savedData.name,
      avatar: savedData.avatar,
      playerId: savedData.playerId
    }, (res) => {
      if (res && res.success) {
        console.log('[LuckyDrawJoin] Re-joined socket room:', targetPin);
      }
    });
  }, [socket, isConnected, targetPin, isRegistered]);

  // Listen to lucky_draw_spin broadcast from Host
  useEffect(() => {
    if (!socket) return;

    const handleLuckyDrawSpin = (data) => {
      if (!data || !data.winner) return;

      const myId = savedData?.playerId;
      const myName = (savedData?.name || '').trim().toLowerCase();
      const winnerId = data.winner.id;
      const winnerName = (data.winner.name || '').trim().toLowerCase();

      const isMe = (myId && winnerId && myId === winnerId) || (myName && myName === winnerName);

      setWinResult({
        isMe,
        winnerName: data.winner.name,
        prizeName: data.prizeName || 'รางวัลพิเศษ 🎉'
      });

      if (isMe) {
        setShowCelebrationModal(true);
        sfx.playFanfare();
        fireConfetti();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200, 100, 400]);
          } catch (e) {}
        }
      }
    };

    socket.on('lucky_draw_spin', handleLuckyDrawSpin);
    return () => {
      socket.off('lucky_draw_spin', handleLuckyDrawSpin);
    };
  }, [socket, savedData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('กรุณาพิมพ์ชื่อของคุณก่อนส่ง');
      return;
    }
    if (!targetPin) {
      setError('ไม่พบรหัส PIN กรุณาสแกน QR ใหม่อีกครั้ง');
      return;
    }
    if (!socket) {
      setError('กำลังเชื่อมต่อระบบ กรุณารอสักครู่...');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const playerId = savedData?.playerId || `p_ld_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const avatar = selectedAvatar || getRandomAvatar();

    socket.emit('join_room', {
      pin: targetPin,
      name: trimmed,
      avatar,
      playerId
    }, (res) => {
      setIsSubmitting(false);
      if (res && res.success) {
        const payload = {
          pin: targetPin,
          name: trimmed,
          avatar,
          playerId,
          isRegistered: true,
          registeredAt: Date.now()
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (e) {}

        setSavedData(payload);
        setIsRegistered(true);
        sfx.playCorrect();
        fireConfetti();
      } else {
        setError(res?.message || 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  };

  const handleEditName = () => {
    setIsRegistered(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 50%, #FFEDD5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '32px 24px',
        boxShadow: '0 20px 40px -15px rgba(234, 88, 12, 0.15)',
        border: '1.5px solid #FED7AA',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Brand Icon Header */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '-56px auto 16px',
          boxShadow: '0 10px 25px rgba(234, 88, 12, 0.35)',
          border: '4px solid #FFFFFF'
        }}>
          <Gift size={36} color="#FFFFFF" />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1E293B', margin: '0 0 4px', letterSpacing: '0.5px' }}>
          KAOJAI LUCKY DRAW 🎁
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 16px' }}>
          ลงทะเบียนร่วมลุ้นรางวัลในกิจกรรม
        </p>

        {targetPin && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFF7ED',
            border: '1px solid #FDBA74',
            padding: '5px 14px',
            borderRadius: '20px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2410C' }}>PIN:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EA580C', letterSpacing: '2px' }}>{targetPin}</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '10px 14px',
            borderRadius: '14px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================
            STATE 1: ALREADY REGISTERED (WAITING SCREEN)
           ========================================= */}
        {isRegistered ? (
          <div>
            <div style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: '20px',
              padding: '24px 18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <img
                  src={`/avatars/${savedData?.avatar || selectedAvatar}`}
                  alt="avatar"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    border: '3px solid #16A34A',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#16A34A', fontSize: '0.9rem', fontWeight: 800, marginBottom: '6px' }}>
                <CheckCircle2 size={18} /> ส่งชื่อเข้าร่วมลุ้นรางวัลแล้ว!
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>
                {savedData?.name || name}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                🔮 ชื่อของคุณอยู่ในอ่างสอยดาว / วงล้อเรียบร้อยแล้ว<br />
                รอลุ้นผลรางวัลบนหน้าจอหลักได้เลย! ✨
              </p>
            </div>

            {/* Broadcast banner of recent draw */}
            {winResult && !winResult.isMe && (
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#92400E',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                🎉 ผู้โชคดีรอบล่าสุด: <strong>{winResult.winnerName}</strong> ({winResult.prizeName})
              </div>
            )}

            {isRegistrationLocked ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#B91C1C'
              }}>
                <Lock size={14} /> ปิดรับลงทะเบียนแล้ว (คุณอยู่ในรายชื่อพร้อมลุ้นรางวัล)
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEditName}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> แก้ไขชื่อหรือรูปโปรไฟล์
              </button>
            )}
          </div>
        ) : isRegistrationLocked ? (
          /* =========================================
             STATE 2.1: REGISTRATION CLOSED (LOCKED)
             ========================================= */
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: '20px',
            padding: '28px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.2)'
            }}>
              <Lock size={32} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#991B1B', margin: '0 0 8px' }}>
              ปิดรับลงทะเบียนแล้ว 🔒
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#7F1D1D', lineHeight: 1.5, margin: '0 0 16px' }}>
              ผู้จัดงานได้ปิดรับรายชื่อสำหรับกิจกรรมรอบนี้แล้วครับ ขออภัยในความไม่สะดวก ✨
            </p>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#64748B',
              fontWeight: 700,
              border: '1px solid #FEE2E2'
            }}>
              💡 หากผู้จัดงานเปิดรับรอบถัดไป หน้าจอนี้จะปลดล็อกให้กรอกชื่อโดยอัตโนมัติ
            </div>
          </div>
        ) : (
          /* =========================================
             STATE 2.2: REGISTRATION FORM
             ========================================= */
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                เลือกรูปโปรไฟล์นำโชค:
              </label>
              <AvatarPicker
                selectedAvatar={selectedAvatar}
                onSelectAvatar={(av) => setSelectedAvatar(av)}
              />
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                ชื่อ - นามสกุล หรือ ชื่อเล่น (สำหรับประกาศรางวัล):
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี, น้องเมย์ การตลาด"
                  maxLength={30}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    borderRadius: '16px',
                    border: '2px solid #CBD5E1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#EA580C'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '18px',
                border: 'none',
                background: !name.trim() || isSubmitting
                  ? '#CBD5E1'
                  : 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                fontWeight: 900,
                cursor: !name.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: !name.trim() || isSubmitting ? 'none' : '0 8px 20px rgba(234, 88, 12, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={20} />
              {isSubmitting ? 'กำลังส่งชื่อ...' : '🎉 ส่งชื่อลุ้นรางวัล!'}
            </button>
          </form>
        )}
      </div>

      {/* =========================================
          WINNER CELEBRATION MODAL ON SMARTPHONE!
         ========================================= */}
      {showCelebrationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: '0 25px 60px -15px rgba(245, 158, 11, 0.5)',
            border: '3px solid #F59E0B'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: '#FEF3C7',
              border: '3px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trophy size={44} color="#D97706" />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#D97706', margin: '0 0 6px' }}>
              🎊 ยินดีด้วย! 🏆
            </h2>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>
              คุณ {savedData?.name || name}
            </p>
            <div style={{
              background: '#FFF7ED',
              border: '1.5px solid #FDBA74',
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '1.1rem',
              fontWeight: 900,
              color: '#C2410C',
              marginBottom: '20px'
            }}>
              🎁 {winResult?.prizeName || 'รางวัลพิเศษ'}
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>
              กรุณาแสดงหน้าจอนี้แก่ผู้จัดงานเพื่อรับของรางวัล
            </p>

            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              รับทราบ / เยี่ยมยอดมาก! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

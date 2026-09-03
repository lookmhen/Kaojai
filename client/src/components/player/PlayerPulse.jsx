import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { Smile, Meh, Frown, Users, Bell, Sparkles, X } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle';

export const PlayerPulse = ({ pin, player, pulseAnsweredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [activeChoice, setActiveChoice] = useState(null);
  const [nudgeAlert, setNudgeAlert] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handlePulseNudge = (data) => {
      // Ignore nudge if this player has already submitted a pulse vote
      if (activeChoice) return;

      sfx.playCuteChime();
      setNudgeAlert(data.message || '🔔 วิทยากรกำลังรอสัญญาณตอบรับจากคุณอยู่นะครับ! ✨');
    };

    socket.on('pulse_nudge_alert', handlePulseNudge);

    return () => {
      socket.off('pulse_nudge_alert', handlePulseNudge);
    };
  }, [socket, activeChoice]);

  const handleSendPulse = (choice) => {
    setActiveChoice(choice);
    setNudgeAlert(null); // Dismiss nudge popup if open
    if (socket) {
      socket.emit('submit_pulse', {
        pin,
        playerId: player.playerId,
        choice
      });
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '30px auto', padding: '0 16px', textAlign: 'center' }}>
      {/* Centered Modal Popup for Trainer Nudge */}
      {nudgeAlert && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '20px'
          }}
          onClick={() => setNudgeAlert(null)}
        >
          <div
            className="animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '3px solid #F59E0B',
              borderRadius: '24px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(245, 158, 11, 0.35)',
              position: 'relative'
            }}
          >
            {/* Close Button in top-right */}
            <button
              type="button"
              onClick={() => setNudgeAlert(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: '#FEF3C7',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#92400E'
              }}
            >
              <X size={18} />
            </button>

            {/* Bouncing Bell Icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#FEF3C7',
                border: '2px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Bell size={36} color="#D97706" className="animate-bounce" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400E', marginBottom: '8px' }}>
              วิทยากรส่งสัญญาณเรียก!
            </h3>

            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#B45309', lineHeight: 1.5, marginBottom: '24px' }}>
              {nudgeAlert}
            </p>

            <button
              type="button"
              onClick={() => setNudgeAlert(null)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              รับทราบ / ตอบสัญญาณตอนนี้ 🚀
            </button>
          </div>
        </div>
      )}

      {/* Counter Badge & Sound Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className="counter-badge">
          <Users size={16} color="var(--accent-earth-orange)" />
          <span>ส่งผลตอบรับแล้ว <span className="highlight">{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
        </div>
        <SoundToggle size={16} style={{ width: '34px', height: '34px' }} />
      </div>

      <div className="glass-card animate-pop" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>
          Training Pulse 💚💛❤️
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ส่งสัญญาณบอกวิทยากรได้ทันทีว่าคุณเข้าใจเนื้อหานี้อย่างไร
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <button
          type="button"
          onClick={() => handleSendPulse('green')}
          style={{
            padding: '18px 16px',
            borderRadius: '14px',
            background: activeChoice === 'green' ? 'var(--pulse-green)' : '#F0FDF4',
            border: '2px solid var(--pulse-green)',
            color: activeChoice === 'green' ? '#FFFFFF' : '#166534',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: activeChoice === 'green' ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Smile size={28} color={activeChoice === 'green' ? '#FFFFFF' : 'var(--pulse-green)'} />
            <span>เข้าใจดีเยี่ยม! (Clear & Confident)</span>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🟢</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendPulse('yellow')}
          style={{
            padding: '18px 16px',
            borderRadius: '14px',
            background: activeChoice === 'yellow' ? 'var(--pulse-yellow)' : '#FFFBEB',
            border: '2px solid var(--pulse-yellow)',
            color: activeChoice === 'yellow' ? '#FFFFFF' : '#92400E',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: activeChoice === 'yellow' ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Meh size={28} color={activeChoice === 'yellow' ? '#FFFFFF' : 'var(--pulse-yellow)'} />
            <span>ขอตัวอย่างเพิ่มเติม (Need Example)</span>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🟡</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendPulse('red')}
          style={{
            padding: '18px 16px',
            borderRadius: '14px',
            background: activeChoice === 'red' ? 'var(--pulse-red)' : '#FEF2F2',
            border: '2px solid var(--pulse-red)',
            color: activeChoice === 'red' ? '#FFFFFF' : '#991B1B',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: activeChoice === 'red' ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Frown size={28} color={activeChoice === 'red' ? '#FFFFFF' : 'var(--pulse-red)'} />
            <span>ขอให้อธิบายซ้ำอีกครั้ง (Need Recap)</span>
          </div>
          <span style={{ fontSize: '1.4rem' }}>🔴</span>
        </button>
      </div>

      {activeChoice && (
        <div className="animate-pop" style={{ marginTop: '20px', color: 'var(--pulse-green)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={18} /> ส่งสัญญาณตอบรับเรียบร้อยแล้ว ขอบคุณครับ!
        </div>
      )}
    </div>
  );
};

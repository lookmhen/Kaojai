import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { Smile, Meh, Frown, Users, Bell, Sparkles, X } from 'lucide-react';

export const PlayerPulse = ({ pin, player, pulseAnsweredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [activeChoice, setActiveChoice] = useState(null);
  const [nudgeAlert, setNudgeAlert] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handlePulseNudge = (data) => {
      sfx.playCuteChime();
      setNudgeAlert(data.message || '🔔 วิทยากรกำลังรอผลตอบรับจากคุณอยู่นะครับ! ✨');
    };

    socket.on('pulse_nudge_alert', handlePulseNudge);

    return () => {
      socket.off('pulse_nudge_alert', handlePulseNudge);
    };
  }, [socket]);

  const handleSendPulse = (choice) => {
    setActiveChoice(choice);
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
      {/* Cute Nudge Floating Modal */}
      {nudgeAlert && (
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '20px',
            padding: '16px 20px',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.35)',
            zIndex: 1200,
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
            <Bell size={26} color="#D97706" className="animate-bounce" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#92400E' }}>
                ส่งสัญญาณเรียกจากวิทยากร
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#B45309' }}>
                {nudgeAlert}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNudgeAlert(null)}
            style={{
              background: '#FDE68A',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#92400E'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Counter Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="counter-badge">
          <Users size={16} color="var(--accent-earth-orange)" />
          <span>ส่งผลตอบรับแล้ว <span className="highlight">{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
        </div>
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

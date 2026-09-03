import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Smile, Meh, Frown, Users } from 'lucide-react';

export const PlayerPulse = ({ pin, player, pulseAnsweredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [activeChoice, setActiveChoice] = useState(null);

  const handleSendPulse = (choice) => {
    setActiveChoice(choice);
    socket.emit('submit_pulse', {
      pin,
      playerId: player.playerId,
      choice
    });
  };

  return (
    <div style={{ maxWidth: '440px', margin: '30px auto', padding: '0 16px', textAlign: 'center' }}>
      {/* Answered / Total Count Counter Badge (CRITICAL USER FEATURE) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="counter-badge">
          <Users size={16} color="var(--accent-yellow)" />
          <span>ส่งผลตอบรับแล้ว <span className="highlight">{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
        </div>
      </div>

      <div className="glass-card animate-pop" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Training Pulse 💚💛❤️
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
          ส่งสัญญาณบอกวิทยากรได้ทันทีว่าคุณเข้าใจเนื้อหานี้อย่างไร
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          type="button"
          onClick={() => handleSendPulse('green')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: activeChoice === 'green' ? 'var(--pulse-green)' : 'rgba(46, 204, 113, 0.2)',
            border: '2px solid var(--pulse-green)',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'green' ? '0 0 24px rgba(46, 204, 113, 0.6)' : 'none',
            transform: activeChoice === 'green' ? 'scale(1.03)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Smile size={32} color={activeChoice === 'green' ? '#fff' : 'var(--pulse-green)'} />
            <span>เข้าใจดีเยี่ยม! (Clear & Confident)</span>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🟢</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendPulse('yellow')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: activeChoice === 'yellow' ? 'var(--pulse-yellow)' : 'rgba(241, 196, 15, 0.2)',
            border: '2px solid var(--pulse-yellow)',
            color: activeChoice === 'yellow' ? '#1a1a1a' : '#fff',
            fontSize: '1.2rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'yellow' ? '0 0 24px rgba(241, 196, 15, 0.6)' : 'none',
            transform: activeChoice === 'yellow' ? 'scale(1.03)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Meh size={32} color={activeChoice === 'yellow' ? '#1a1a1a' : 'var(--pulse-yellow)'} />
            <span>ขอตัวอย่างเพิ่มเติม (Need Example)</span>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🟡</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendPulse('red')}
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: activeChoice === 'red' ? 'var(--pulse-red)' : 'rgba(231, 76, 60, 0.2)',
            border: '2px solid var(--pulse-red)',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'red' ? '0 0 24px rgba(231, 76, 60, 0.6)' : 'none',
            transform: activeChoice === 'red' ? 'scale(1.03)' : 'scale(1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Frown size={32} color={activeChoice === 'red' ? '#fff' : 'var(--pulse-red)'} />
            <span>ขอให้อธิบายซ้ำอีกครั้ง (Need Recap)</span>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🔴</span>
        </button>
      </div>

      {activeChoice && (
        <div style={{ marginTop: '20px', color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>
          ✓ ส่งผลตอบรับแล้ว สามารถกดเปลี่ยนระดับได้ตลอดเวลา
        </div>
      )}
    </div>
  );
};

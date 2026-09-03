import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Play, Activity, LogOut } from 'lucide-react';

export const HostHeader = ({ pin, mode, counts, onSwitchMode, onLeave }) => {
  return (
    <header
      style={{
        background: 'rgba(15, 12, 41, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)' }}>
            GAME PIN
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-yellow)', letterSpacing: '3px', lineHeight: 1 }}>
            {pin}
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '30px', padding: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <button
            type="button"
            onClick={() => onSwitchMode('QUIZ')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              background: mode === 'QUIZ' ? 'var(--primary-purple)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={16} /> Quiz Game
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('PULSE')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              background: mode === 'PULSE' ? 'var(--pulse-green)' : 'transparent',
              color: mode === 'PULSE' ? '#000' : '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={16} /> Training Pulse
          </button>
        </div>
      </div>

      {/* Answered / Total Count Counter Badge (CRITICAL USER FEATURE) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="counter-badge">
          <Users size={20} color="var(--accent-yellow)" />
          <span>
            {mode === 'QUIZ' ? 'ตอบแล้ว ' : 'ส่งสัญญาณแล้ว '}
            <span className="highlight">
              {mode === 'QUIZ' ? (counts?.answeredCount || 0) : (counts?.pulseAnsweredCount || 0)}
            </span>
            {' / '}
            {counts?.totalPlayers || 0} คน
          </span>
        </div>

        <button
          type="button"
          onClick={onLeave}
          style={{
            background: 'rgba(231, 76, 60, 0.2)',
            border: '1px solid #e74c3c',
            color: '#ff7675',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={16} /> จบเซสชัน
        </button>
      </div>
    </header>
  );
};

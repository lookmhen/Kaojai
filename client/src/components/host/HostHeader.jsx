import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Play, Activity, LogOut } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle';

export const HostHeader = ({ pin, mode, counts, onSwitchMode, onLeave }) => {
  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 700 }}>
            GAME PIN
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-earth-orange)', letterSpacing: '3px', lineHeight: 1 }}>
            {pin}
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '30px', padding: '4px', border: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={() => onSwitchMode('QUIZ')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              background: mode === 'QUIZ' ? 'var(--accent-earth-blue)' : 'transparent',
              color: mode === 'QUIZ' ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={15} /> Quiz Game
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('PULSE')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              background: mode === 'PULSE' ? 'var(--accent-earth-green)' : 'transparent',
              color: mode === 'PULSE' ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={15} /> Training Pulse
          </button>
        </div>
      </div>

      {/* Answered / Total Count Counter Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="counter-badge">
          <Users size={18} color="var(--accent-earth-orange)" />
          <span>
            {mode === 'QUIZ' ? 'ตอบแล้ว ' : 'ส่งสัญญาณแล้ว '}
            <span className="highlight">
              {mode === 'QUIZ' ? (counts?.answeredCount || 0) : (counts?.pulseAnsweredCount || 0)}
            </span>
            {' / '}
            {counts?.totalPlayers || 0} คน
          </span>
        </div>

        <SoundToggle />

        <button
          type="button"
          onClick={onLeave}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: 700,
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

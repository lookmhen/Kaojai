import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { Smile, Meh, Frown, Users, Bell, Sparkles, X, Heart, Flame, Lightbulb, HelpCircle, LogOut } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle';

const QUICK_REACTIONS = [
  { emoji: '🔥', label: 'สุดยอด' },
  { emoji: '💡', label: 'เก็ทเลย' },
  { emoji: '👏', label: 'ปรบมือ' },
  { emoji: '❤️', label: 'ชอบมาก' },
  { emoji: '❓', label: 'สงสัย' }
];

export const PlayerPulse = ({ pin, player, pulseAnsweredCount, totalPlayers, onLeave }) => {
  const { socket } = useSocket();
  const [activeChoice, setActiveChoice] = useState(null);
  const [nudgeAlert, setNudgeAlert] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handlePulseNudge = (data) => {
      if (activeChoice) return;
      sfx.playCuteChime();
      setNudgeAlert(data.message || '🔔 วิทยากรกำลังรอสัญญาณตอบรับจากคุณอยู่นะครับ! ✨');
    };

    socket.on('pulse_nudge_alert', handlePulseNudge);

    return () => {
      socket.off('pulse_nudge_alert', handlePulseNudge);
    };
  }, [socket, activeChoice]);

  const triggerFloatingEmoji = (emoji) => {
    const id = `${Date.now()}_${Math.random()}`;
    const left = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    setFloatingEmojis(prev => [...prev.slice(-12), { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  const handleSendPulse = (choice) => {
    setActiveChoice(choice);
    setNudgeAlert(null);
    sfx.playPop();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    const emojiMap = { green: '🟢', yellow: '🟡', red: '🔴' };
    triggerFloatingEmoji(emojiMap[choice] || '✨');

    if (socket) {
      socket.emit('submit_pulse', {
        pin,
        playerId: player.playerId,
        choice
      });
    }
  };

  const handleSendQuickReaction = (reaction) => {
    sfx.playBubble();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    triggerFloatingEmoji(reaction.emoji);

    if (socket) {
      socket.emit('send_pulse_reaction', {
        pin,
        emoji: reaction.emoji,
        playerId: player.playerId
      });
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '20px auto', padding: '0 16px', textAlign: 'center', position: 'relative' }}>
      {/* Floating Emojis Overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: 0,
          width: '100vw',
          height: '240px',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 999
        }}
      >
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              bottom: '10px',
              left: `${item.left}%`,
              fontSize: '2.4rem',
              animation: 'pulseFloatUp 1.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulseFloatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-25px) scale(1.2);
          }
          100% {
            transform: translateY(-200px) scale(1);
            opacity: 0;
          }
        }
        @keyframes heartPulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

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

      {/* Header Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(19, 136, 8, 0.1)',
            color: '#138808',
            border: '1px solid rgba(19, 136, 8, 0.25)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.8rem',
            fontWeight: 800
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'heartPulseRing 1.5s infinite' }} />
          LIVE PULSE
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="counter-badge" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
            <Users size={14} color="var(--accent-earth-orange)" />
            <span>ตอบแล้ว <span className="highlight">{pulseAnsweredCount}</span> / {totalPlayers}</span>
          </div>
          <SoundToggle size={16} style={{ width: '32px', height: '32px' }} />
          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              title="ออกจากห้อง / กลับหน้าหลัก"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#DC2626'
              }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Pulse Card Banner */}
      <div
        className="glass-card animate-pop"
        style={{
          marginBottom: '20px',
          padding: '24px 18px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1.5px solid #E2E8F0',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
        }}
      >
        <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>💚💛❤️</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '4px' }}>
          ความเข้าใจในหัวข้อนี้เป็นอย่างไรบ้าง?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
          ส่งสัญญาณบอกวิทยากรได้ทันที แตะเปลี่ยนระดับได้ตลอดเวลา ✨
        </p>
      </div>

      {/* 3 Interactive Sentiment Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* GREEN: Clear & Confident */}
        <button
          type="button"
          onClick={() => handleSendPulse('green')}
          style={{
            padding: '16px 18px',
            borderRadius: '18px',
            background: activeChoice === 'green'
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : '#F0FDF4',
            border: activeChoice === 'green' ? '2.5px solid #047857' : '2px solid #86EFAC',
            color: activeChoice === 'green' ? '#FFFFFF' : '#166534',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'green'
              ? '0 8px 20px rgba(16, 185, 129, 0.4)'
              : '0 2px 8px rgba(16, 185, 129, 0.08)',
            transform: activeChoice === 'green' ? 'scale(1.025)' : 'scale(1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: activeChoice === 'green' ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Smile size={26} color={activeChoice === 'green' ? '#FFFFFF' : '#15803D'} />
            </div>
            <div>
              <div style={{ fontSize: '1.02rem', lineHeight: 1.2 }}>เข้าใจดีเยี่ยม!</div>
              <div style={{ fontSize: '0.78rem', opacity: activeChoice === 'green' ? 0.9 : 0.8, fontWeight: 600 }}>
                Clear & Confident พร้อมลุยต่อ
              </div>
            </div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🟢</span>
        </button>

        {/* YELLOW: Need Example */}
        <button
          type="button"
          onClick={() => handleSendPulse('yellow')}
          style={{
            padding: '16px 18px',
            borderRadius: '18px',
            background: activeChoice === 'yellow'
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : '#FFFBEB',
            border: activeChoice === 'yellow' ? '2.5px solid #B45309' : '2px solid #FCD34D',
            color: activeChoice === 'yellow' ? '#FFFFFF' : '#92400E',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'yellow'
              ? '0 8px 20px rgba(245, 158, 11, 0.4)'
              : '0 2px 8px rgba(245, 158, 11, 0.08)',
            transform: activeChoice === 'yellow' ? 'scale(1.025)' : 'scale(1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: activeChoice === 'yellow' ? 'rgba(255,255,255,0.25)' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Meh size={26} color={activeChoice === 'yellow' ? '#FFFFFF' : '#B45309'} />
            </div>
            <div>
              <div style={{ fontSize: '1.02rem', lineHeight: 1.2 }}>ขอตัวอย่างเพิ่มเติม</div>
              <div style={{ fontSize: '0.78rem', opacity: activeChoice === 'yellow' ? 0.9 : 0.8, fontWeight: 600 }}>
                Need Case Study / ตัวอย่างรูปธรรม
              </div>
            </div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🟡</span>
        </button>

        {/* RED: Need Recap */}
        <button
          type="button"
          onClick={() => handleSendPulse('red')}
          style={{
            padding: '16px 18px',
            borderRadius: '18px',
            background: activeChoice === 'red'
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
              : '#FEF2F2',
            border: activeChoice === 'red' ? '2.5px solid #B91C1C' : '2px solid #FCA5A5',
            color: activeChoice === 'red' ? '#FFFFFF' : '#991B1B',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: activeChoice === 'red'
              ? '0 8px 20px rgba(239, 68, 68, 0.4)'
              : '0 2px 8px rgba(239, 68, 68, 0.08)',
            transform: activeChoice === 'red' ? 'scale(1.025)' : 'scale(1)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: activeChoice === 'red' ? 'rgba(255,255,255,0.25)' : '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Frown size={26} color={activeChoice === 'red' ? '#FFFFFF' : '#DC2626'} />
            </div>
            <div>
              <div style={{ fontSize: '1.02rem', lineHeight: 1.2 }}>ขอให้อธิบายซ้ำอีกครั้ง</div>
              <div style={{ fontSize: '0.78rem', opacity: activeChoice === 'red' ? 0.9 : 0.8, fontWeight: 600 }}>
                Need Recap สรุปประเด็นหลักใหม่อีกที
              </div>
            </div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>🔴</span>
        </button>
      </div>

      {/* Confirmation indicator */}
      {activeChoice && (
        <div
          className="animate-pop"
          style={{
            marginTop: '16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '10px 16px',
            color: '#166534',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} color="#166534" />
          <span>บันทึกสัญญาณของคุณแล้ว (แตะเปลี่ยนปุ่มด้านบนได้ตลอดเวลา)</span>
        </div>
      )}

      {/* Quick Live Reaction Dock (Live Emojis) */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚡ ยิงปฏิกิริยาสดขึ้นจอผู้สอน (Quick Reactions)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
          {QUICK_REACTIONS.map(item => (
            <button
              key={item.emoji}
              type="button"
              onClick={() => handleSendQuickReaction(item)}
              style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '14px',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
              title={item.label}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.emoji}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

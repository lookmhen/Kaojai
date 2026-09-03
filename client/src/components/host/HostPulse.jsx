import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Smile, Meh, Frown, Activity, Bell, Sparkles } from 'lucide-react';

export const HostPulse = ({ pin, pulseVotes, pulseAnsweredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [isNudged, setIsNudged] = useState(false);

  const greenCount = pulseVotes?.green || 0;
  const yellowCount = pulseVotes?.yellow || 0;
  const redCount = pulseVotes?.red || 0;

  const totalVoted = greenCount + yellowCount + redCount;
  const unvotedCount = Math.max(0, (totalPlayers || 0) - (pulseAnsweredCount || 0));

  const greenPct = totalVoted > 0 ? Math.round((greenCount / totalVoted) * 100) : 0;
  const yellowPct = totalVoted > 0 ? Math.round((yellowCount / totalVoted) * 100) : 0;
  const redPct = totalVoted > 0 ? Math.round((redCount / totalVoted) * 100) : 0;

  const handleSendNudge = () => {
    if (!socket || !pin) return;
    socket.emit('send_pulse_nudge', { pin });
    setIsNudged(true);
    setTimeout(() => setIsNudged(false), 3000);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '30px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', padding: '32px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--pulse-green)', fontSize: '1rem', fontWeight: 800, marginBottom: '8px' }}>
          <Activity size={22} /> LIVE PULSE FEEDBACK
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
          การสำรวจความเข้าใจระหว่างการฝึกอบรม (Training Pulse)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
          ผู้เรียนสามารถกดแจ้งระดับความเข้าใจบนหน้าจอมือถือได้แบบเรียลไทม์
        </p>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="counter-badge" style={{ fontSize: '1.1rem', padding: '8px 20px' }}>
            <Users size={18} color="var(--accent-earth-orange)" />
            <span>ส่งสัญญาณแล้ว <span className="highlight" style={{ fontSize: '1.35rem' }}>{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
          </div>

          <button
            type="button"
            onClick={handleSendNudge}
            style={{
              background: isNudged ? '#FEF3C7' : '#F59E0B',
              color: isNudged ? '#92400E' : '#FFFFFF',
              border: isNudged ? '2px solid #F59E0B' : 'none',
              borderRadius: '30px',
              padding: '10px 22px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Bell size={18} className={isNudged ? 'animate-bounce' : ''} />
            {isNudged ? '✨ ส่งสัญญาณเรียกสำเร็จแล้ว!' : `🔔 ส่งสัญญาณตามผู้เรียน (ยังไม่ส่งอีก ${unvotedCount} คน)`}
          </button>
        </div>
      </div>

      {/* Live Bar Chart */}
      <div className="glass-card" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Green Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <Smile size={22} color="var(--pulse-green)" />
                <span>เข้าใจดีเยี่ยม (Clear & Confident)</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pulse-green)' }}>
                {greenCount} คน ({greenPct}%)
              </span>
            </div>
            <div style={{ height: '32px', background: '#F1F5F9', borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
              <div
                style={{
                  height: '100%',
                  width: `${greenPct}%`,
                  background: 'var(--pulse-green)',
                  borderRadius: '16px',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>

          {/* Yellow Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <Meh size={22} color="var(--pulse-yellow)" />
                <span>ขอตัวอย่างเพิ่มเติม (Need Example)</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pulse-yellow)' }}>
                {yellowCount} คน ({yellowPct}%)
              </span>
            </div>
            <div style={{ height: '32px', background: '#F1F5F9', borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
              <div
                style={{
                  height: '100%',
                  width: `${yellowPct}%`,
                  background: 'var(--pulse-yellow)',
                  borderRadius: '16px',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>

          {/* Red Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <Frown size={22} color="var(--pulse-red)" />
                <span>ขอให้อธิบายซ้ำอีกครั้ง (Need Recap)</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pulse-red)' }}>
                {redCount} คน ({redPct}%)
              </span>
            </div>
            <div style={{ height: '32px', background: '#F1F5F9', borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
              <div
                style={{
                  height: '100%',
                  width: `${redPct}%`,
                  background: 'var(--pulse-red)',
                  borderRadius: '16px',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

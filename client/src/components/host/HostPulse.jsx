import React from 'react';
import { Users, Smile, Meh, Frown, Activity } from 'lucide-react';

export const HostPulse = ({ pulseVotes, pulseAnsweredCount, totalPlayers }) => {
  const greenCount = pulseVotes?.green || 0;
  const yellowCount = pulseVotes?.yellow || 0;
  const redCount = pulseVotes?.red || 0;

  const totalVoted = greenCount + yellowCount + redCount;
  
  const greenPct = totalVoted > 0 ? Math.round((greenCount / totalVoted) * 100) : 0;
  const yellowPct = totalVoted > 0 ? Math.round((yellowCount / totalVoted) * 100) : 0;
  const redPct = totalVoted > 0 ? Math.round((redCount / totalVoted) * 100) : 0;

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

        <div style={{ marginTop: '20px' }}>
          <div className="counter-badge" style={{ fontSize: '1.1rem', padding: '8px 20px' }}>
            <Users size={18} color="var(--accent-earth-orange)" />
            <span>ส่งสัญญาณแล้ว <span className="highlight" style={{ fontSize: '1.35rem' }}>{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
          </div>
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

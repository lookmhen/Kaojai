import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { Users, Smile, Meh, Frown, Activity, Bell, Sparkles, Zap, Flame, Lightbulb, Heart, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export const HostPulse = ({ pin, pulseVotes, pulseAnsweredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [isNudged, setIsNudged] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({ '🔥': 0, '💡': 0, '👏': 0, '❤️': 0, '❓': 0 });

  const greenCount = pulseVotes?.green || 0;
  const yellowCount = pulseVotes?.yellow || 0;
  const redCount = pulseVotes?.red || 0;

  const totalVoted = greenCount + yellowCount + redCount;
  const unvotedCount = Math.max(0, (totalPlayers || 0) - (pulseAnsweredCount || 0));

  const greenPct = totalVoted > 0 ? Math.round((greenCount / totalVoted) * 100) : 0;
  const yellowPct = totalVoted > 0 ? Math.round((yellowCount / totalVoted) * 100) : 0;
  const redPct = totalVoted > 0 ? Math.round((redCount / totalVoted) * 100) : 0;

  // Clarity Index Calculation (Weighted: Green = 100%, Yellow = 50%, Red = 0%)
  const clarityIndex = totalVoted > 0
    ? Math.round(((greenCount * 1.0 + yellowCount * 0.5) / totalVoted) * 100)
    : 100;

  // Real-time Reaction Stream Listener
  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data) => {
      const id = data.id || `${Date.now()}_${Math.random()}`;
      const emoji = data.emoji || '✨';
      const left = Math.floor(Math.random() * 80) + 10; // 10% to 90%

      sfx.playBubble();

      setReactionCounts(prev => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1
      }));

      setFloatingEmojis(prev => [...prev.slice(-20), { id, emoji, left }]);

      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(item => item.id !== id));
      }, 1600);
    };

    socket.on('pulse_reaction_received', handleReaction);

    return () => {
      socket.off('pulse_reaction_received', handleReaction);
    };
  }, [socket]);

  const handleSendNudge = () => {
    if (!socket || !pin) return;
    sfx.playCuteChime();
    socket.emit('send_pulse_nudge', { pin });
    setIsNudged(true);
    setTimeout(() => setIsNudged(false), 3000);
  };

  // Determine Smart Trainer Advice
  let adviceColor = '#10B981';
  let adviceBg = '#ECFDF5';
  let adviceBorder = '#A7F3D0';
  let adviceTitle = 'ห้องเรียนพลังงานยอดเยี่ยม & เข้าใจชัดเจน 🚀';
  let adviceText = 'ผู้เรียนส่วนใหญ่เข้าใจเนื้อหาเป็นอย่างดี วิทยากรสามารถลุยต่อหรือเพิ่มหัวข้อเจาะลึกได้เลยครับ';
  let adviceIcon = <CheckCircle2 size={24} color="#059669" />;

  if (redPct >= 25) {
    adviceColor = '#EF4444';
    adviceBg = '#FEF2F2';
    adviceBorder = '#FECDD3';
    adviceTitle = 'มีผู้เรียนสะดุดในเนื้อหานี้ (Need Recap) ⚠️';
    adviceText = 'มีผู้เรียนมากกว่า 25% ขอให้สรุปซ้ำ แนะนำให้หยุดถามคำถามสั้นๆ หรือให้เพื่อนช่วยแชร์ความเข้าใจก่อนไปต่อครับ';
    adviceIcon = <AlertTriangle size={24} color="#DC2626" />;
  } else if (yellowPct >= 30) {
    adviceColor = '#D97706';
    adviceBg = '#FFFBEB';
    adviceBorder = '#FDE68A';
    adviceTitle = 'ผู้เรียนกำลังต้องการตัวอย่างจริง (Need Case Study) 💡';
    adviceText = 'ผู้เรียนอยากเห็นตัวอย่างการนำไปใช้จริง แนะนำให้เปิดภาพ Case Study หรือเล่าสถานการณ์ตัวอย่างประกอบครับ';
    adviceIcon = <Lightbulb size={24} color="#D97706" />;
  }

  return (
    <div style={{ maxWidth: '1020px', margin: '24px auto', padding: '0 24px', position: 'relative' }}>
      {/* Floating Emojis Stream on Host Big Screen */}
      <div
        style={{
          position: 'fixed',
          bottom: '120px',
          left: 0,
          width: '100vw',
          height: '360px',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1200
        }}
      >
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: `${item.left}%`,
              fontSize: '3.2rem',
              animation: 'hostFloatUp 1.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
              filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.18))'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes hostFloatUp {
          0% {
            transform: translateY(0) scale(0.6) rotate(-10deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-40px) scale(1.3) rotate(5deg);
          }
          100% {
            transform: translateY(-320px) scale(1) rotate(-5deg);
            opacity: 0;
          }
        }
        @keyframes ecgPulseWave {
          0% { transform: scaleY(1); opacity: 0.6; }
          50% { transform: scaleY(1.8); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.6; }
        }
      `}</style>

      {/* Main Header Card */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', padding: '28px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#138808', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
          <Activity size={22} color="#138808" /> LIVE AUDIENCE PULSE & ENERGY MONITOR
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.3 }}>
          การสำรวจความเข้าใจสดระหว่างการอบรม (Training Pulse)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '6px' }}>
          ผู้เรียนสามารถกดแจ้งระดับความเข้าใจและยิง Reaction สดผ่านสมาร์ตโฟนได้แบบ Real-time
        </p>

        {/* Counter and Nudge Controls */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="counter-badge" style={{ fontSize: '1.05rem', padding: '8px 22px' }}>
            <Users size={18} color="var(--accent-earth-orange)" />
            <span>ตอบสัญญาณแล้ว <span className="highlight" style={{ fontSize: '1.4rem' }}>{pulseAnsweredCount}</span> / {totalPlayers} คน</span>
          </div>

          <button
            type="button"
            onClick={handleSendNudge}
            style={{
              background: isNudged ? '#FEF3C7' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: isNudged ? '#92400E' : '#FFFFFF',
              border: isNudged ? '2px solid #F59E0B' : 'none',
              borderRadius: '30px',
              padding: '10px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Bell size={18} className={isNudged ? 'animate-bounce' : ''} />
            {isNudged ? '✨ ส่งสัญญาณตามสำเร็จแล้ว!' : `🔔 ส่งสัญญาณตามผู้เรียน (ยังไม่ตอบ ${unvotedCount} คน)`}
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Clarity Gauge & Live Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Clarity Index & Live Heartbeat Wave */}
        <div
          className="glass-card animate-pop"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ROOM CLARITY INDEX
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', marginBottom: '18px' }}>
              ดัชนีความเข้าใจรวมทั้งห้อง
            </div>

            {/* Circular Meter Badge */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                background: totalVoted === 0
                  ? '#F1F5F9'
                  : clarityIndex >= 80
                  ? 'radial-gradient(circle, #DCFCE7 0%, #F0FDF4 100%)'
                  : clarityIndex >= 50
                  ? 'radial-gradient(circle, #FEF3C7 0%, #FFFBEB 100%)'
                  : 'radial-gradient(circle, #FEE2E2 0%, #FEF2F2 100%)',
                border: `6px solid ${totalVoted === 0 ? '#CBD5E1' : clarityIndex >= 80 ? '#10B981' : clarityIndex >= 50 ? '#F59E0B' : '#EF4444'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: totalVoted === 0 ? 'none' : `0 10px 25px ${clarityIndex >= 80 ? 'rgba(16, 185, 129, 0.25)' : clarityIndex >= 50 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}
            >
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: totalVoted === 0 ? '#64748B' : clarityIndex >= 80 ? '#15803D' : clarityIndex >= 50 ? '#B45309' : '#DC2626', lineHeight: 1 }}>
                {totalVoted === 0 ? '-' : `${clarityIndex}%`}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                {totalVoted === 0 ? 'รอผลตอบรับ' : clarityIndex >= 80 ? 'ยอดเยี่ยม' : clarityIndex >= 50 ? 'ปานกลาง' : 'ควรทบทวน'}
              </span>
            </div>

            {/* Heartbeat Waveform Simulator */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '24px', margin: '14px 0' }}>
              {[12, 24, 8, 18, 28, 14, 20, 10, 26, 16].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: '4px',
                    height: `${h}px`,
                    background: clarityIndex >= 80 ? '#10B981' : clarityIndex >= 50 ? '#F59E0B' : '#EF4444',
                    borderRadius: '4px',
                    animation: `ecgPulseWave 1.2s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quick Reaction Tally Box */}
          <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              ⚡ ปฏิกิริยาสดจากห้องเรียน (Live Reactions)
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span
                  key={emoji}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ color: '#0F172A' }}>{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 3 High-Energy Sentiment Live Bars */}
        <div className="glass-card animate-pop" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {/* GREEN: Clear & Confident */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smile size={22} color="#15803D" />
                </div>
                <div>
                  <div>เข้าใจดีเยี่ยม (Clear & Confident)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>พร้อมลุยเนื้อหาถัดไป</div>
                </div>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803D' }}>
                {greenCount} คน ({greenPct}%)
              </span>
            </div>
            <div style={{ height: '36px', background: '#F1F5F9', borderRadius: '18px', overflow: 'hidden', border: '1.5px solid #E2E8F0', padding: '3px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${greenPct}%`,
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          {/* YELLOW: Need Example */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 800, color: '#92400E' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Meh size={22} color="#B45309" />
                </div>
                <div>
                  <div>ขอตัวอย่างเพิ่มเติม (Need Example)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ต้องการเคสจำลอง / ภาพจริง</div>
                </div>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#B45309' }}>
                {yellowCount} คน ({yellowPct}%)
              </span>
            </div>
            <div style={{ height: '36px', background: '#F1F5F9', borderRadius: '18px', overflow: 'hidden', border: '1.5px solid #E2E8F0', padding: '3px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${yellowPct}%`,
                  background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          {/* RED: Need Recap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 800, color: '#991B1B' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Frown size={22} color="#DC2626" />
                </div>
                <div>
                  <div>ขอให้อธิบายซ้ำอีกครั้ง (Need Recap)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ยังจับประเด็นไม่ได้ / สับสน</div>
                </div>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#DC2626' }}>
                {redCount} คน ({redPct}%)
              </span>
            </div>
            <div style={{ height: '36px', background: '#F1F5F9', borderRadius: '18px', overflow: 'hidden', border: '1.5px solid #E2E8F0', padding: '3px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${redPct}%`,
                  background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Smart Trainer Insights & Dynamic Advice Banner */}
      <div
        className="glass-card animate-pop"
        style={{
          padding: '20px 24px',
          background: adviceBg,
          border: `2px solid ${adviceBorder}`,
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {adviceIcon}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: adviceColor, marginBottom: '2px' }}>
            {adviceTitle}
          </div>
          <div style={{ fontSize: '0.92rem', color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
            {adviceText}
          </div>
        </div>
      </div>
    </div>
  );
};

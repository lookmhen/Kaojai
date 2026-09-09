import React, { useEffect } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Trophy, Home } from 'lucide-react';

export const PlayerEndedView = ({ player, leaderboard, onLeave }) => {
  useEffect(() => {
    fireConfetti();
    sfx.playFanfare();
  }, []);

  const myEntry = leaderboard?.find(p => p.playerId === player?.playerId);
  const myRankIdx = leaderboard ? leaderboard.findIndex(p => p.playerId === player?.playerId) : -1;
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;
  const myScore = myEntry?.score !== undefined ? myEntry.score : (player?.score || 0);

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop" style={{ padding: '36px 20px' }}>
        <Trophy size={60} color="var(--accent-earth-orange)" style={{ marginBottom: '14px' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
          จบกิจกรรมตอบคำถามแล้ว!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px', marginBottom: '24px' }}>
          ขอบคุณสำหรับการมีส่วนร่วม ✨
        </p>

        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
            style={{ width: '76px', height: '76px', borderRadius: '50%', border: '3px solid var(--accent-earth-orange)', marginBottom: '10px', background: '#FFFFFF' }}
          />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{player.name}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>อันดับของคุณ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-earth-orange)' }}>
                {myRank ? `#${myRank}` : '-'}
              </div>
            </div>
            <div style={{ width: '1px', background: '#CBD5E1' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>คะแนนรวม</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-earth-green)' }}>
                {myScore.toLocaleString()} Pts
              </div>
            </div>
          </div>
        </div>

        <div style={{ color: 'var(--accent-earth-blue)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px' }}>
          🌟 รอวิทยากรสรุปกิจกรรมบนหน้าจอใหญ่...
        </div>

        {onLeave && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={onLeave}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '30px',
                background: 'var(--accent-earth-blue)',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Home size={18} /> กลับสู่หน้าหลัก
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

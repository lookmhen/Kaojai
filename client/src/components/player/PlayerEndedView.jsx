import React, { useEffect } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Trophy, Award } from 'lucide-react';

export const PlayerEndedView = ({ player, leaderboard }) => {
  useEffect(() => {
    fireConfetti();
    sfx.playFanfare();
  }, []);

  const myRankIdx = leaderboard.findIndex(p => p.playerId === player.playerId);
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;
  const myScore = player.score || 0;

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop" style={{ padding: '36px 20px' }}>
        <Trophy size={64} color="var(--accent-yellow)" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(90deg, #FDCB6E, #FF7675)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          จบกิจกรรมตอบคำถามแล้ว!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginTop: '6px', marginBottom: '24px' }}>
          ขอบคุณสำหรับการมีส่วนร่วมสุดยอดเยี่ยม ✨
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '24px' }}>
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
            style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent-yellow)', marginBottom: '10px' }}
          />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{player.name}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>อันดับของคุณ</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-yellow)' }}>
                {myRank ? `#${myRank}` : '-'}
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>คะแนนรวม</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--pulse-green)' }}>
                {myScore.toLocaleString()} Pts
              </div>
            </div>
          </div>
        </div>

        <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.95rem' }}>
          🌟 รอวิทยากรสรุปกิจกรรมบนหน้าจอใหญ่...
        </div>
      </div>
    </div>
  );
};

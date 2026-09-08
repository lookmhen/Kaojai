import React, { useEffect } from 'react';
import { Trophy, Award, Flag, Eye, Sparkles, LogOut } from 'lucide-react';
import { sfx } from '../../utils/audioSFX';

export const PlayerLeaderboardView = ({ player, leaderboard, onLeave }) => {
  const myEntry = leaderboard?.find(p => p.playerId === player?.playerId);
  const myRankIdx = leaderboard ? leaderboard.findIndex(p => p.playerId === player?.playerId) : -1;
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;
  const myScore = myEntry?.score !== undefined ? myEntry.score : (player?.score || 0);
  const pointsEarned = myEntry?.lastPointsEarned || 0;

  useEffect(() => {
    if (myRank && myRank <= 3) {
      sfx.playFanfare();
    }
  }, [myRank]);

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop" style={{ padding: '32px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-earth-orange)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          <Flag size={16} /> LEADERBOARD STANDINGS
        </div>

        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '6px' }}>
          สรุปอันดับและการแข่งขันรอบนี้! 🏎️
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px' }}>
          สังเกตการวิ่งแซงของรถแข่งบนหน้าจอใหญ่ของวิทยากร
        </p>

        {/* My Rank and Score Card */}
        <div style={{ background: '#F8FAFC', borderRadius: '18px', padding: '20px', border: '1.5px solid #E2E8F0', marginBottom: '22px' }}>
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
            style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid var(--accent-earth-orange)', marginBottom: '8px', background: '#FFFFFF' }}
          />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{player.name}</h2>

          {pointsEarned > 0 && (
            <div style={{ color: '#166534', fontWeight: 800, fontSize: '0.9rem', marginTop: '4px' }}>
              +{pointsEarned} คะแนนในรอบนี้! ✨
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>อันดับของคุณ</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-earth-orange)' }}>
                {myRank ? `#${myRank}` : '-'}
              </div>
            </div>
            <div style={{ width: '1px', background: '#CBD5E1' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>คะแนนรวม</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-earth-green)' }}>
                {myScore.toLocaleString()} Pts
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 58, 138, 0.06)',
            borderRadius: '14px',
            padding: '12px 16px',
            color: 'var(--accent-earth-blue)',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Eye size={18} />
          <span>รอวิทยากรเปิดคำถามข้อถัดไป...</span>
        </div>

        {onLeave && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={onLeave}
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: '30px',
                background: '#F1F5F9',
                color: '#475569',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} color="#DC2626" /> ออกจากห้อง / กลับหน้าหลัก
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

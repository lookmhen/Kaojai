import React, { useEffect } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Trophy, ArrowRight, Play } from 'lucide-react';

export const HostLeaderboard = ({ leaderboard, onNextQuestion }) => {
  useEffect(() => {
    fireConfetti();
    sfx.playFanfare();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const remainingTop = leaderboard.slice(3, 5);

  return (
    <div style={{ maxWidth: '950px', margin: '30px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Trophy size={36} color="var(--accent-yellow)" /> LEADERBOARD TOP PLAYERS
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
          ตารางผู้ทำคะแนนสูงสุดประจำเซสชัน
        </p>
      </div>

      {/* Podium View for Top 3 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '40px', minHeight: '260px' }}>
        {/* 2nd Place */}
        {top3[1] && (
          <div className="glass-card animate-pop" style={{ width: '220px', textAlign: 'center', padding: '20px 12px', borderTop: '4px solid #c0392b' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#bdc3c7', marginBottom: '8px' }}>อันดับ 2 🥈</div>
            <img
              src={`/avatars/${top3[1].avatar || '0291dcc0ce.svg'}`}
              alt={top3[1].name}
              onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
              style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #bdc3c7', marginBottom: '8px' }}
            />
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{top3[1].name}</div>
            <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '1.2rem', marginTop: '4px' }}>
              {top3[1].score} Pts
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="glass-card animate-pop animate-glow" style={{ width: '250px', textAlign: 'center', padding: '28px 16px', background: 'rgba(253, 203, 110, 0.15)', border: '2px solid var(--accent-yellow)', transform: 'translateY(-20px)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-yellow)', marginBottom: '8px' }}>🏆 อันดับ 1 🥇</div>
            <img
              src={`/avatars/${top3[0].avatar || '0291dcc0ce.svg'}`}
              alt={top3[0].name}
              onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
              style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid var(--accent-yellow)', marginBottom: '10px' }}
            />
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff' }}>{top3[0].name}</div>
            <div style={{ color: 'var(--accent-yellow)', fontWeight: 900, fontSize: '1.5rem', marginTop: '6px' }}>
              {top3[0].score} Pts
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="glass-card animate-pop" style={{ width: '220px', textAlign: 'center', padding: '20px 12px', borderTop: '4px solid #e67e22' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e67e22', marginBottom: '8px' }}>อันดับ 3 🥉</div>
            <img
              src={`/avatars/${top3[2].avatar || '0291dcc0ce.svg'}`}
              alt={top3[2].name}
              onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
              style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #e67e22', marginBottom: '8px' }}
            />
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{top3[2].name}</div>
            <div style={{ color: 'var(--accent-yellow)', fontWeight: 800, fontSize: '1.2rem', marginTop: '4px' }}>
              {top3[2].score} Pts
            </div>
          </div>
        )}
      </div>

      {/* Remaining Top 4-5 */}
      {remainingTop.length > 0 && (
        <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '32px' }}>
          {remainingTop.map((p, idx) => (
            <div
              key={p.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: idx !== remainingTop.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', width: '30px' }}>
                  #{idx + 4}
                </span>
                <img
                  src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                  alt={p.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</span>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--accent-yellow)', fontSize: '1.1rem' }}>
                {p.score} Pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Next Question Control */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={onNextQuestion}
          style={{
            padding: '16px 40px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)'
          }}
        >
          ลุยคำถามถัดไป <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
};

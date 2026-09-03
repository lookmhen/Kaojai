import React, { useEffect, useState } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Trophy, ArrowRight, Flag, RotateCcw } from 'lucide-react';

export const HostLeaderboard = ({ leaderboard, isEnded, onNextQuestion, onResetToLobby }) => {
  const [animatedScores, setAnimatedScores] = useState({});

  useEffect(() => {
    fireConfetti();
    sfx.playFanfare();

    const initialMap = {};
    leaderboard.forEach(p => {
      initialMap[p.playerId] = p.previousScore || 0;
    });
    setAnimatedScores(initialMap);

    const timer = setTimeout(() => {
      const targetMap = {};
      leaderboard.forEach(p => {
        targetMap[p.playerId] = p.score;
      });
      setAnimatedScores(targetMap);
    }, 400);

    return () => clearTimeout(timer);
  }, [leaderboard]);

  const maxScore = Math.max(...leaderboard.map(p => p.score), 1000);

  return (
    <div style={{ maxWidth: '980px', margin: '20px auto', padding: '0 20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', padding: '24px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-yellow)', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
          <Flag size={20} color="var(--accent-yellow)" /> {isEnded ? '🏆 FINAL PODIUM CHAMPIONS 🏆' : 'KAOJAI RACING LEADERBOARD'} <Flag size={20} color="var(--accent-yellow)" />
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(90deg, #FDCB6E, #FF7675)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEnded ? 'สรุปอันดับผู้ชนะการแข่งขันสิ้นสุดเกม! 🎉' : 'สรุปการอันดับและการเปลี่ยนแปลงคะแนนรอบนี้ 🏎️💨'}
        </h1>
      </div>

      {/* Racing Track Rows */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leaderboard.map((player, idx) => {
            const currentScore = animatedScores[player.playerId] !== undefined ? animatedScores[player.playerId] : player.score;
            const pct = Math.min(100, Math.max(12, Math.round((currentScore / maxScore) * 100)));
            const pointsEarned = player.lastPointsEarned || 0;
            const rank = idx + 1;

            let rankBadge = `#${rank}`;
            let rankColor = 'rgba(255,255,255,0.7)';
            let barGradient = 'linear-gradient(90deg, #6C5CE7 0%, #a29bfe 100%)';

            if (rank === 1) {
              rankBadge = '🥇 #1';
              rankColor = 'var(--accent-yellow)';
              barGradient = 'linear-gradient(90deg, #f83600 0%, #fe8c00 100%)';
            } else if (rank === 2) {
              rankBadge = '🥈 #2';
              rankColor = '#bdc3c7';
              barGradient = 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)';
            } else if (rank === 3) {
              rankBadge = '🥉 #3';
              rankColor = '#e67e22';
              barGradient = 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)';
            }

            return (
              <div
                key={player.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: rankColor,
                    textAlign: 'center',
                    flexShrink: 0
                  }}
                >
                  {rankBadge}
                </div>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
                    alt={player.name}
                    onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: rank === 1 ? '3px solid var(--accent-yellow)' : '2px solid rgba(255,255,255,0.4)',
                      background: 'rgba(0,0,0,0.4)'
                    }}
                  />
                  {pointsEarned > 0 && !isEnded && (
                    <div
                      className="animate-pop"
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-12px',
                        background: 'var(--pulse-green)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        boxShadow: '0 0 10px rgba(46, 204, 113, 0.8)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      +{pointsEarned}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                      {player.name}
                    </span>
                    <span style={{ fontWeight: 900, color: 'var(--accent-yellow)', fontSize: '1.2rem' }}>
                      {currentScore.toLocaleString()} Pts
                    </span>
                  </div>

                  <div
                    style={{
                      height: '24px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.15)',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: barGradient,
                        borderRadius: '12px',
                        transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        boxShadow: rank === 1 ? '0 0 15px rgba(254, 140, 0, 0.6)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                        🏎️
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Button */}
      <div style={{ textAlign: 'center' }}>
        {isEnded ? (
          <button
            type="button"
            onClick={onResetToLobby}
            style={{
              padding: '16px 48px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #00CEC9 0%, #0984e3 100%)',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 206, 201, 0.4)'
            }}
          >
            <RotateCcw size={22} /> จบเกม / กลับสู่หน้า Lobby
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextQuestion}
            style={{
              padding: '16px 48px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)'
            }}
          >
            ลุยคำถามถัดไป <ArrowRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

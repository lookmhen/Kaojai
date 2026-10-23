import React, { useState, useEffect } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Gift, Trophy, Sparkles, X, Award } from 'lucide-react';

export const PlayerLuckyDrawOverlay = ({
  spinData = null,
  currentPlayerData = null,
  onClose = null
}) => {
  const [phase, setPhase] = useState('IDLE'); // 'IDLE' | 'SCOOPING' | 'CRACKING' | 'CELEBRATING'

  useEffect(() => {
    if (!spinData) {
      setPhase('IDLE');
      return;
    }

    const { durationMs = 2400 } = spinData;
    const crackStartTime = Math.min(1100, Math.round(durationMs * 0.45));

    setPhase('SCOOPING');

    const crackTimer = setTimeout(() => {
      setPhase('CRACKING');
      sfx.playBallCrack();
    }, crackStartTime);

    const celebrationTimer = setTimeout(() => {
      setPhase('CELEBRATING');
      sfx.playFanfare();
      fireConfetti();
    }, durationMs);

    return () => {
      clearTimeout(crackTimer);
      clearTimeout(celebrationTimer);
    };
  }, [spinData]);

  if (!spinData) return null;

  const { candidateNames = [], winner, prizeName = 'รางวัลพิเศษ 🎉' } = spinData;
  const showCelebration = phase === 'CELEBRATING';
  const isMe = currentPlayerData && winner && (
    (currentPlayerData.playerId && currentPlayerData.playerId === winner.id) ||
    (currentPlayerData.name && currentPlayerData.name.toLowerCase() === (winner.name || '').toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: isMe ? '4px solid #F59E0B' : '1px solid rgba(255,255,255,0.8)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '12px',
            padding: '8px',
            cursor: 'pointer',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="ปิด"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            color: '#92400E',
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: 800,
            fontSize: '0.85rem',
            marginBottom: '10px'
          }}
        >
          <Gift size={16} /> LUCKY DRAW LIVE 🌊
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#1E293B' }}>
          {phase === 'SCOOPING' && 'กำลังตักลูกบอลในอ่างน้ำ... 🌊'}
          {phase === 'CRACKING' && '✨ กำลังแกะลูกบอลปริศนา... 🔮'}
          {phase === 'CELEBRATING' && 'ผลการจับรางวัล! 🎉'}
        </h3>

        <div style={{ fontSize: '0.9rem', color: '#EA580C', fontWeight: 800, marginBottom: '16px' }}>
          🎁 {prizeName}
        </div>

        {/* Water Pool Scoop View & Capsule Split Animation */}
        <div style={{ margin: '8px 0', width: '100%', opacity: showCelebration ? 0.3 : 1, transition: 'opacity 0.3s' }}>
          {phase === 'SCOOPING' && (
            <div style={{
              width: '260px',
              height: '240px',
              margin: '0 auto',
              borderRadius: '24px',
              background: 'radial-gradient(circle at 35% 35%, #E0F2FE 0%, #BAE6FD 50%, #0284C7 100%)',
              border: '4px solid #38BDF8',
              boxShadow: '0 12px 28px rgba(2, 132, 199, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{ fontSize: '3.8rem', animation: 'bounce 0.8s infinite alternate' }}>
                🌊
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0369A1', marginTop: '10px' }}>
                กำลังลุ้นลูกบอลในอ่างน้ำ...
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0284C7', marginTop: '4px', fontWeight: 700 }}>
                ✨ ขอให้เป็นชื่อคุณ! ✨
              </div>
            </div>
          )}

          {phase === 'CRACKING' && (
            <div style={{
              width: '260px',
              height: '240px',
              margin: '0 auto',
              borderRadius: '24px',
              background: 'radial-gradient(circle at 50% 50%, #FEF3C7 0%, #FDE68A 45%, #F59E0B 100%)',
              border: '4px solid #F59E0B',
              boxShadow: '0 14px 32px rgba(245, 158, 11, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Rotating Sunburst Halo Background */}
              <div style={{
                position: 'absolute',
                inset: '-40px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(251, 191, 36, 0.5) 40%, rgba(245, 158, 11, 0) 70%)',
                animation: 'spin 5s linear infinite'
              }} />

              {/* Capsule Halves & Revealing Lucky Parchment */}
              <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Center Lucky Parchment Slip */}
                <div style={{
                  position: 'absolute',
                  width: '95px',
                  padding: '8px 6px',
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
                  border: '2px solid #D97706',
                  borderRadius: '10px',
                  boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  animation: 'scaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#DC2626', letterSpacing: '0.5px' }}>★ LUCKY ★</span>
                  <span style={{ fontSize: '1.25rem', margin: '1px 0' }}>🎁</span>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#92400E' }}>ลุ้นชื่อผู้โชคดี...</span>
                </div>

                {/* Top Hemisphere (Upper Half) */}
                <div style={{
                  position: 'absolute',
                  top: '0px',
                  left: '50%',
                  width: '84px',
                  height: '42px',
                  background: 'radial-gradient(circle at 50% 20%, #FFA8A8 0%, #FF5E62 60%, #D9383D 100%)',
                  borderTopLeftRadius: '84px',
                  borderTopRightRadius: '84px',
                  border: '2px solid #FFFFFF',
                  borderBottom: '3px solid #FFF',
                  boxShadow: '0 -4px 12px rgba(217, 56, 61, 0.35)',
                  transform: 'translate(-50%, -22px) rotate(-14deg)',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'bounce 0.9s infinite alternate'
                }}>
                  <span style={{ fontSize: '0.9rem', marginTop: '-3px' }}>✨</span>
                </div>

                {/* Bottom Hemisphere (Lower Half) */}
                <div style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '50%',
                  width: '84px',
                  height: '42px',
                  background: 'radial-gradient(circle at 50% 80%, #FFA8A8 0%, #FF5E62 60%, #D9383D 100%)',
                  borderBottomLeftRadius: '84px',
                  borderBottomRightRadius: '84px',
                  border: '2px solid #FFFFFF',
                  borderTop: '3px solid #FFF',
                  boxShadow: '0 4px 12px rgba(217, 56, 61, 0.35)',
                  transform: 'translate(-50%, 22px) rotate(14deg)',
                  zIndex: 3,
                  animation: 'bounce 0.9s infinite alternate'
                }} />
              </div>

              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#92400E', marginTop: '14px', zIndex: 4 }}>
                ✨ กำลังแกะลูกบอลปริศนา... ✨
              </div>
            </div>
          )}
        </div>

        {/* Winner Celebration View */}
        {showCelebration && winner && (
          <div
            style={{
              position: 'absolute',
              inset: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              animation: 'scaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isMe ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#FEF3C7',
                color: isMe ? '#FFFFFF' : '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)'
              }}
            >
              {isMe ? <Award size={36} /> : <Trophy size={36} />}
            </div>

            {isMe ? (
              <>
                <div style={{ color: '#D97706', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>
                  🌟 YOU WON! 🌟
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EA580C', margin: '4px 0 8px' }}>
                  ยินดีด้วยครับ! คุณได้รับรางวัล 🎉
                </h2>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '14px' }}>
                  🎁 {prizeName}
                </div>
              </>
            ) : (
              <>
                <div style={{ color: '#D97706', fontSize: '0.8rem', fontWeight: 800 }}>
                  ขอแสดงความยินดีกับผู้โชคดี!
                </div>
                {winner.avatar && (
                  <img
                    src={`/avatars/${winner.avatar}`}
                    alt={winner.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '3px solid #F59E0B',
                      margin: '10px 0 6px',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1E293B', margin: '4px 0' }}>
                  {winner.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#EA580C', fontWeight: 800, marginBottom: '14px' }}>
                  ได้รับ {prizeName}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 28px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
              }}
            >
              ปิดหน้าต่าง ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

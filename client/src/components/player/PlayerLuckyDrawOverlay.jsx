import React, { useState, useEffect } from 'react';
import { LuckyWheel } from '../common/LuckyWheel';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Gift, Trophy, Sparkles, X, Award } from 'lucide-react';

export const PlayerLuckyDrawOverlay = ({
  spinData = null,
  currentPlayerData = null,
  onClose = null
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!spinData) {
      setShowCelebration(false);
      setIsSpinning(false);
      return;
    }

    const { candidateNames = [], winner, durationMs = 4500 } = spinData;
    const count = candidateNames.length;

    // Find winner index
    let chosenIdx = 0;
    if (winner && count > 0) {
      const idx = candidateNames.findIndex(n => n.toLowerCase() === (winner.name || '').toLowerCase());
      chosenIdx = idx >= 0 ? idx : 0;
    }

    setWinnerIndex(chosenIdx);
    setIsSpinning(true);
    setShowCelebration(false);

    const timer = setTimeout(() => {
      setIsSpinning(false);
      setShowCelebration(true);
      sfx.playFanfare();
      fireConfetti();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [spinData]);

  if (!spinData) return null;

  const { candidateNames = [], winner, prizeName = 'รางวัลพิเศษ 🎉' } = spinData;
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
          <Gift size={16} /> {spinData?.drawStyle === 'POOL' ? 'LUCKY DRAW LIVE 🌊' : 'LUCKY DRAW LIVE 🎡'}
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#1E293B' }}>
          {isSpinning
            ? (spinData?.drawStyle === 'POOL' ? 'กำลังตักลูกบอลในอ่างน้ำ... 🌊' : 'กำลังลุ้นผู้โชคดี... 🎲')
            : 'ผลการจับรางวัล! 🎉'}
        </h3>

        <div style={{ fontSize: '0.9rem', color: '#EA580C', fontWeight: 800, marginBottom: '16px' }}>
          🎁 {prizeName}
        </div>

        {/* Wheel or Water Pool Scoop View while drawing */}
        <div style={{ margin: '8px 0', opacity: showCelebration ? 0.35 : 1, transition: 'opacity 0.3s' }}>
          {spinData?.drawStyle === 'POOL' ? (
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
          ) : (
            <LuckyWheel
              candidates={candidateNames}
              isSpinning={isSpinning}
              winnerIndex={winnerIndex}
              duration={spinData?.durationMs || 4500}
              size={280}
            />
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

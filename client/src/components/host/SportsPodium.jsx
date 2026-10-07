import React from 'react';
import { Crown, Trophy, Medal, Sparkles } from 'lucide-react';

export const SportsPodium = ({ leaderboard = [] }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;

  return (
    <div
      style={{
        position: 'relative',
        padding: '36px 16px 20px 16px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        marginBottom: '28px',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambience / Sparkles */}
      <div style={{ position: 'absolute', top: '16px', left: '24px', color: '#F59E0B', opacity: 0.7 }}>
        <Sparkles size={28} />
      </div>
      <div style={{ position: 'absolute', top: '24px', right: '32px', color: '#F59E0B', opacity: 0.7 }}>
        <Sparkles size={24} />
      </div>

      {/* Podium Stage Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '16px',
          maxWidth: '780px',
          margin: '0 auto',
          paddingBottom: '8px'
        }}
      >
        {/* =========================================
            RANK 2: SILVER (Left)
            ========================================= */}
        {top2 && (
          <div
            style={{
              flex: 1,
              maxWidth: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'podiumRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both'
            }}
          >
            {/* Player Avatar & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px', width: '100%' }}>
              {/* Avatar with Silver Ring */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img
                  src={`/avatars/${top2.avatar || '0291dcc0ce.svg'}`}
                  alt={top2.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    border: '3.5px solid #94A3B8',
                    background: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(148, 163, 184, 0.5), 0 8px 16px rgba(0, 0, 0, 0.1)',
                    display: 'block'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  🥈 #2
                </div>
              </div>

              {/* Player Name */}
              <div
                title={top2.name}
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: 'var(--text-main, #1E293B)',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '4px'
                }}
              >
                {top2.name}
              </div>

              {/* Score */}
              <div
                style={{
                  marginTop: '4px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '16px',
                  padding: '3px 12px',
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}
              >
                {(top2.score || 0).toLocaleString()} Pts
              </div>
            </div>

            {/* Pedestal Stand (Silver) */}
            <div
              style={{
                width: '100%',
                height: '160px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 24px rgba(100, 116, 139, 0.35)',
                borderRadius: '16px 16px 4px 4px',
                overflow: 'hidden'
              }}
            >
              {/* Top Step Surface */}
              <div
                style={{
                  height: '14px',
                  background: 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)',
                  borderBottom: '1px solid #CBD5E1'
                }}
              />
              {/* Pillar Body */}
              <div
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, #94A3B8 0%, #64748B 60%, #475569 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    fontSize: '4.2rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'rgba(255, 255, 255, 0.95)',
                    textShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    letterSpacing: '-2px'
                  }}
                >
                  2
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '2px'
                  }}
                >
                  <Medal size={14} /> รองชนะเลิศ
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            RANK 1: GOLD CHAMPION (Center, Highest)
            ========================================= */}
        {top1 && (
          <div
            style={{
              flex: 1.15,
              maxWidth: '250px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'podiumRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
              zIndex: 2
            }}
          >
            {/* Player Avatar & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px', width: '100%', position: 'relative' }}>
              {/* Floating Crown above Avatar */}
              <div
                style={{
                  marginBottom: '-6px',
                  animation: 'crownFloat 2.4s ease-in-out infinite',
                  filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.5))'
                }}
              >
                <Crown size={38} color="#F59E0B" fill="#FBBF24" />
              </div>

              {/* Avatar with Gold Ring & Glow */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img
                  src={`/avatars/${top1.avatar || '0291dcc0ce.svg'}`}
                  alt={top1.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{
                    width: '106px',
                    height: '106px',
                    borderRadius: '50%',
                    border: '4.5px solid #F59E0B',
                    background: '#FFFFFF',
                    boxShadow: '0 0 28px rgba(245, 158, 11, 0.65), 0 10px 22px rgba(0, 0, 0, 0.16)',
                    display: 'block'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    padding: '3px 12px',
                    borderRadius: '14px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 3px 8px rgba(217, 119, 6, 0.4)'
                  }}
                >
                  🥇 CHAMPION
                </div>
              </div>

              {/* Player Name */}
              <div
                title={top1.name}
                style={{
                  fontSize: '1.38rem',
                  fontWeight: 900,
                  color: 'var(--text-main, #0F172A)',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '6px'
                }}
              >
                {top1.name}
              </div>

              {/* Score */}
              <div
                style={{
                  marginTop: '4px',
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  color: '#92400E',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '18px',
                  padding: '4px 16px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
                }}
              >
                {(top1.score || 0).toLocaleString()} Pts
              </div>
            </div>

            {/* Pedestal Stand (Gold) */}
            <div
              style={{
                width: '100%',
                height: '225px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 32px rgba(217, 119, 6, 0.45)',
                borderRadius: '18px 18px 4px 4px',
                overflow: 'hidden'
              }}
            >
              {/* Top Step Surface */}
              <div
                style={{
                  height: '16px',
                  background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)',
                  borderBottom: '1px solid #FDE68A'
                }}
              />
              {/* Pillar Body */}
              <div
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 65%, #B45309 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    fontSize: '5.2rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'rgba(255, 255, 255, 0.96)',
                    textShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
                    letterSpacing: '-2px'
                  }}
                >
                  1
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.86rem',
                    fontWeight: 900,
                    color: '#FEF3C7',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '2px'
                  }}
                >
                  <Trophy size={16} /> ชนะเลิศอันดับ 1
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            RANK 3: BRONZE (Right)
            ========================================= */}
        {top3 && (
          <div
            style={{
              flex: 1,
              maxWidth: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'podiumRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both'
            }}
          >
            {/* Player Avatar & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px', width: '100%' }}>
              {/* Avatar with Bronze Ring */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img
                  src={`/avatars/${top3.avatar || '0291dcc0ce.svg'}`}
                  alt={top3.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '3.5px solid #EA580C',
                    background: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(234, 88, 12, 0.4), 0 8px 16px rgba(0, 0, 0, 0.1)',
                    display: 'block'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  🥉 #3
                </div>
              </div>

              {/* Player Name */}
              <div
                title={top3.name}
                style={{
                  fontSize: '1.12rem',
                  fontWeight: 900,
                  color: 'var(--text-main, #1E293B)',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '4px'
                }}
              >
                {top3.name}
              </div>

              {/* Score */}
              <div
                style={{
                  marginTop: '4px',
                  background: '#FFF7ED',
                  color: '#C2410C',
                  border: '1px solid #FED7AA',
                  borderRadius: '16px',
                  padding: '3px 12px',
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}
              >
                {(top3.score || 0).toLocaleString()} Pts
              </div>
            </div>

            {/* Pedestal Stand (Bronze) */}
            <div
              style={{
                width: '100%',
                height: '115px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 20px rgba(194, 65, 12, 0.35)',
                borderRadius: '16px 16px 4px 4px',
                overflow: 'hidden'
              }}
            >
              {/* Top Step Surface */}
              <div
                style={{
                  height: '14px',
                  background: 'linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%)',
                  borderBottom: '1px solid #FED7AA'
                }}
              />
              {/* Pillar Body */}
              <div
                style={{
                  flex: 1,
                  background: 'linear-gradient(180deg, #EA580C 0%, #C2410C 60%, #9A3412 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'rgba(255, 255, 255, 0.94)',
                    textShadow: '0 4px 10px rgba(0, 0, 0, 0.22)',
                    letterSpacing: '-2px'
                  }}
                >
                  3
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#FFEDD5',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '1px'
                  }}
                >
                  <Medal size={13} /> รองชนะเลิศ
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Floor Shadow */}
      <div
        style={{
          maxWidth: '750px',
          height: '12px',
          margin: '0 auto',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0) 70%)',
          borderRadius: '50%'
        }}
      />
    </div>
  );
};

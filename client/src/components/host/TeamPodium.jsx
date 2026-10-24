import React from 'react';
import { Crown, Trophy, Medal, Sparkles, Users, Award } from 'lucide-react';

export const TeamPodium = ({ teamLeaderboard = [] }) => {
  if (!teamLeaderboard || teamLeaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <Users size={40} style={{ opacity: 0.5, marginBottom: '8px' }} />
        <p style={{ fontWeight: 700 }}>ยังไม่มีข้อมูลคะแนนทีมในรอบนี้</p>
      </div>
    );
  }

  const top1 = teamLeaderboard[0] || null;
  const top2 = teamLeaderboard[1] || null;
  const top3 = teamLeaderboard[2] || null;
  const runnersUp = teamLeaderboard.slice(3);

  const renderTeamCard = (team, rank, medalEmoji, pedestalHeight, gradient, ringColor) => {
    if (!team) return <div style={{ flex: 1, maxWidth: '240px' }} />;

    return (
      <div
        style={{
          flex: 1,
          maxWidth: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `podiumRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${rank === 1 ? '0.1s' : rank === 2 ? '0.25s' : '0.4s'} both`
        }}
      >
        {/* Team Banner & Emblem */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px', width: '100%' }}>
          {/* Badge with Team Color */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            {rank === 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-26px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#F59E0B',
                  animation: 'crownFloat 2.5s ease-in-out infinite'
                }}
              >
                <Crown size={32} />
              </div>
            )}
            <div
              style={{
                width: rank === 1 ? '96px' : '82px',
                height: rank === 1 ? '96px' : '82px',
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${team.color || '#4F46E5'} 0%, rgba(0,0,0,0.3) 100%)`,
                border: `3.5px solid ${ringColor}`,
                boxShadow: `0 0 24px ${team.color || '#4F46E5'}66, 0 8px 16px rgba(0,0,0,0.12)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <Users size={rank === 1 ? 38 : 32} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, marginTop: '2px' }}>
                {team.members?.length || team.membersCount || 0} คน
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: gradient,
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 900,
                padding: '3px 10px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
              }}
            >
              {medalEmoji} #{rank}
            </div>
          </div>

          {/* Team Name */}
          <div
            title={team.name}
            style={{
              fontWeight: 900,
              fontSize: rank === 1 ? '1.15rem' : '1rem',
              color: 'var(--text-main)',
              textAlign: 'center',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: '4px'
            }}
          >
            {team.name}
          </div>

          {/* Members preview */}
          {team.members && team.members.length > 0 && (
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px'
              }}
              title={team.members.map(m => typeof m === 'object' ? m.name : m).join(', ')}
            >
              {team.members.map(m => typeof m === 'object' ? m.name : m).join(', ')}
            </div>
          )}
        </div>

        {/* Podium Pedestal */}
        <div
          style={{
            width: '100%',
            height: `${pedestalHeight}px`,
            background: gradient,
            borderRadius: '16px 16px 4px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: `0 10px 25px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)`,
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '8px'
          }}
        >
          <div style={{ fontSize: rank === 1 ? '1.75rem' : '1.45rem', fontWeight: 900, letterSpacing: '0.5px' }}>
            {(team.totalScore || team.score || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>
            คะแนนรวม
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '36px 16px 20px 16px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(79, 70, 229, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        marginBottom: '28px',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambience / Sparkles */}
      <div style={{ position: 'absolute', top: '16px', left: '24px', color: '#6366F1', opacity: 0.7 }}>
        <Sparkles size={28} />
      </div>
      <div style={{ position: 'absolute', top: '24px', right: '32px', color: '#6366F1', opacity: 0.7 }}>
        <Sparkles size={24} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px' }}>
          <Users size={14} /> TEAM BATTLE PODIUM
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          ทำเนียบแชมป์ประเภททีม 🛡️⚡
        </h2>
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
        {/* RANK 2: SILVER (Left) */}
        {renderTeamCard(
          top2,
          2,
          '🥈',
          135,
          'linear-gradient(180deg, #94A3B8 0%, #475569 100%)',
          '#94A3B8'
        )}

        {/* RANK 1: GOLD (Center) */}
        {renderTeamCard(
          top1,
          1,
          '🥇',
          180,
          'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
          '#F59E0B'
        )}

        {/* RANK 3: BRONZE (Right) */}
        {renderTeamCard(
          top3,
          3,
          '🥉',
          105,
          'linear-gradient(180deg, #D97706 0%, #B45309 100%)',
          '#CD7F32'
        )}
      </div>

      {/* Runners-up (Rank 4+) */}
      {runnersUp.length > 0 && (
        <div style={{ maxWidth: '680px', margin: '24px auto 8px auto' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            อันดับทีมอื่นๆ
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {runnersUp.map((team, idx) => (
              <div
                key={team.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>
                    #{idx + 4}
                  </span>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: team.color || '#4F46E5',
                      boxShadow: `0 0 8px ${team.color || '#4F46E5'}88`
                    }}
                  />
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {team.name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      ({team.members?.length || team.membersCount || 0} คน)
                    </span>
                  </div>
                </div>

                <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.98rem' }}>
                  {(team.totalScore || team.score || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>แต้ม</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

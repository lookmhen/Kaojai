import React, { useState } from 'react';
import { Swords, Trophy, Users, Award, Flame, Zap, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export const TugOfWarView = ({ teamLeaderboard = [] }) => {
  const { t } = useI18n();

  if (!teamLeaderboard || teamLeaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <Users size={40} style={{ opacity: 0.5, marginBottom: '8px' }} />
        <p style={{ fontWeight: 700 }}>ยังไม่มีข้อมูลคะแนนทีมในรอบนี้</p>
      </div>
    );
  }

  // If there are multiple teams, allow selecting which 2 teams to face off, default to top 2
  const [team1Index, setTeam1Index] = useState(0);
  const [team2Index, setTeam2Index] = useState(teamLeaderboard.length > 1 ? 1 : 0);

  const team1 = teamLeaderboard[team1Index] || teamLeaderboard[0];
  const team2 = teamLeaderboard[team2Index] || teamLeaderboard[1] || team1;

  const score1 = team1?.score || 0;
  const score2 = team2?.score || 0;
  const totalScore = score1 + score2;

  // Calculate pull offset (-35% to +35% from center)
  let pullOffset = 0; // negative = pulled to left (team1), positive = pulled to right (team2)
  if (totalScore > 0) {
    const ratio1 = score1 / totalScore; // 0.0 to 1.0
    // ratio1 of 0.5 means center (0 offset)
    // ratio1 of 1.0 means left (-35% offset)
    // ratio1 of 0.0 means right (+35% offset)
    pullOffset = (0.5 - ratio1) * 70; // maps 0.5->0, 1.0->-35, 0.0->+35
  }

  const scoreDiff = Math.abs(score1 - score2);
  const leadingTeam = score1 > score2 ? team1 : score2 > score1 ? team2 : null;

  return (
    <div style={{ width: '100%', marginBottom: '28px' }}>
      <style>{`
        @keyframes tugPullLeft {
          0%, 100% { transform: translateX(0) rotate(-6deg); }
          50% { transform: translateX(-8px) rotate(-10deg); }
        }
        @keyframes tugPullRight {
          0%, 100% { transform: translateX(0) rotate(6deg); }
          50% { transform: translateX(8px) rotate(10deg); }
        }
        @keyframes ropeTension {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.92); }
        }
        @keyframes ribbonPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(234, 88, 12, 0.6)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 14px rgba(234, 88, 12, 0.9)); }
        }
        @keyframes dustPuff {
          0% { opacity: 0.3; transform: scale(0.8) translateY(0); }
          50% { opacity: 0.8; transform: scale(1.2) translateY(-4px); }
          100% { opacity: 0.3; transform: scale(0.8) translateY(0); }
        }
      `}</style>

      {/* Main Tug-of-War Arena Card */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
          border: '2px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Arena Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FFF7ED', border: '1.5px solid #FDBA74', padding: '6px 18px', borderRadius: '30px', color: '#C2410C', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            <Swords size={16} /> สงครามชักเย่อคะแนนทีม (TUG-OF-WAR BATTLE) <Swords size={16} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
            {leadingTeam
              ? `🔥 ${leadingTeam.name} กำลังออกแรงดึงนำอยู่ +${scoreDiff.toLocaleString()} คะแนน!`
              : '⚡ คะแนนเท่ากันอย่างดุเดือด! กำลังดึงรั้งกันอยู่ตรงกลาง!'}
          </h2>
        </div>

        {/* Team Matchup Selector (if > 2 teams) */}
        {teamLeaderboard.length > 2 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>เลือกคู่ประชัน:</span>
            <select
              value={team1Index}
              onChange={(e) => setTeam1Index(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: team1.color || '#2563EB', background: '#FFFFFF', outline: 'none' }}
            >
              {teamLeaderboard.map((t, idx) => (
                <option key={t.id || idx} value={idx} disabled={idx === team2Index}>
                  #{idx + 1} {t.name} ({t.score.toLocaleString()} Pts)
                </option>
              ))}
            </select>

            <span style={{ fontWeight: 900, color: '#EA580C', fontSize: '0.9rem' }}>VS</span>

            <select
              value={team2Index}
              onChange={(e) => setTeam2Index(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800, color: team2.color || '#E11D48', background: '#FFFFFF', outline: 'none' }}
            >
              {teamLeaderboard.map((t, idx) => (
                <option key={t.id || idx} value={idx} disabled={idx === team1Index}>
                  #{idx + 1} {t.name} ({t.score.toLocaleString()} Pts)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pull Force Gauge Bar */}
        <div style={{ maxWidth: '700px', margin: '0 auto 32px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 900, flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ color: team1.color || '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: team1.color || '#2563EB' }} />
              {team1.name}: {score1.toLocaleString()} Pts ({totalScore > 0 ? Math.round((score1 / totalScore) * 100) : 50}%)
            </span>
            <span style={{ color: team2.color || '#E11D48', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ({totalScore > 0 ? Math.round((score2 / totalScore) * 100) : 50}%) {score2.toLocaleString()} Pts :{team2.name}
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: team2.color || '#E11D48' }} />
            </span>
          </div>

          {/* Tug Progress Bar with Center Splitter */}
          <div style={{ height: '20px', width: '100%', background: '#E2E8F0', borderRadius: '14px', overflow: 'hidden', display: 'flex', position: 'relative', border: '2px solid #CBD5E1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <div
              style={{
                width: `${totalScore > 0 ? (score1 / totalScore) * 100 : 50}%`,
                background: `linear-gradient(90deg, ${team1.color || '#2563EB'}, ${team1.color || '#2563EB'}DD)`,
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            <div
              style={{
                width: `${totalScore > 0 ? (score2 / totalScore) * 100 : 50}%`,
                background: `linear-gradient(90deg, ${team2.color || '#E11D48'}DD, ${team2.color || '#E11D48'})`,
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            {/* Center Dead-Lock Line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '3px', background: '#FFFFFF', transform: 'translateX(-50%)', boxShadow: '0 0 4px rgba(0,0,0,0.4)', zIndex: 2 }} />
          </div>
        </div>

        {/* 🪢 THE TUG-OF-WAR ARENA FIELD */}
        <div
          style={{
            minHeight: '260px',
            background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 40%, #D97706 100%)',
            borderRadius: '20px',
            padding: '24px 16px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '3px solid #B45309',
            boxShadow: 'inset 0 8px 16px rgba(180, 83, 9, 0.3)',
            overflow: 'hidden'
          }}
        >
          {/* Ground Markings: Center Danger Pit Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '12px',
              transform: 'translateX(-50%)',
              background: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 10px, #FFFFFF 10px, #FFFFFF 20px)',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.4)',
              zIndex: 1,
              opacity: 0.85
            }}
          />

          {/* LEFT TEAM: Tug Line */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              zIndex: 3,
              paddingLeft: '12px'
            }}
          >
            {/* Team 1 Banner */}
            <div style={{ background: '#FFFFFF', padding: '8px 16px', borderRadius: '16px', border: `3px solid ${team1.color || '#2563EB'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: team1.color || '#2563EB', textTransform: 'uppercase' }}>
                🚩 ทีมฝั่งซ้าย (#{team1Index + 1})
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B' }}>
                {team1.name}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: team1.color || '#2563EB' }}>
                {score1.toLocaleString()} Pts
              </div>
            </div>

            {/* Team 1 Avatars Pulling */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                animation: 'tugPullLeft 0.8s ease-in-out infinite'
              }}
            >
              {(team1.members && team1.members.length > 0 ? team1.members.slice(0, 5) : [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }]).map((m, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={`/avatars/${m.avatar || '0291dcc0ce.svg'}`}
                    alt={m.name || 'Member'}
                    onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                    style={{
                      width: 'clamp(38px, 6vw, 54px)',
                      height: 'clamp(38px, 6vw, 54px)',
                      borderRadius: '50%',
                      border: `3px solid ${team1.color || '#2563EB'}`,
                      background: '#FFFFFF',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      transform: 'scaleX(-1)' // face towards rope center
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#451A03', marginTop: '2px', maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name || `P${idx + 1}`}
                  </span>
                  {/* Dust puff under feet */}
                  <div style={{ width: '20px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'dustPuff 0.8s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>

          {/* 🪢 THE ROPE & DYNAMIC CENTER RIBBON */}
          <div
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              top: '58%',
              transform: 'translateY(-50%)',
              height: '16px',
              background: 'repeating-linear-gradient(45deg, #78350F, #78350F 12px, #92400E 12px, #92400E 24px, #B45309 24px, #B45309 36px)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.4)',
              zIndex: 2,
              animation: 'ropeTension 0.8s ease-in-out infinite'
            }}
          >
            {/* The Shifting Center Ribbon Marker */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `calc(50% + ${pullOffset}%)`,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 4
              }}
            >
              {/* Flag / Ribbon */}
              <div
                style={{
                  width: '32px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.6)',
                  animation: 'ribbonPulse 1.2s ease-in-out infinite'
                }}
              />
              <div
                style={{
                  marginTop: '4px',
                  background: '#1E293B',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}
              >
                {leadingTeam ? `${leadingTeam.name} +${scoreDiff.toLocaleString()}` : 'TIE 50/50'}
              </div>
            </div>
          </div>

          {/* RIGHT TEAM: Tug Line */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              zIndex: 3,
              paddingRight: '12px'
            }}
          >
            {/* Team 2 Banner */}
            <div style={{ background: '#FFFFFF', padding: '8px 16px', borderRadius: '16px', border: `3px solid ${team2.color || '#E11D48'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: '14px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: team2.color || '#E11D48', textTransform: 'uppercase' }}>
                🚩 ทีมฝั่งขวา (#{team2Index + 1})
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B' }}>
                {team2.name}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: team2.color || '#E11D48' }}>
                {score2.toLocaleString()} Pts
              </div>
            </div>

            {/* Team 2 Avatars Pulling */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                animation: 'tugPullRight 0.8s ease-in-out infinite'
              }}
            >
              {(team2.members && team2.members.length > 0 ? team2.members.slice(0, 5) : [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }]).map((m, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={`/avatars/${m.avatar || '0291dcc0ce.svg'}`}
                    alt={m.name || 'Member'}
                    onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                    style={{
                      width: 'clamp(38px, 6vw, 54px)',
                      height: 'clamp(38px, 6vw, 54px)',
                      borderRadius: '50%',
                      border: `3px solid ${team2.color || '#E11D48'}`,
                      background: '#FFFFFF',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#451A03', marginTop: '2px', maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name || `P${idx + 1}`}
                  </span>
                  {/* Dust puff under feet */}
                  <div style={{ width: '20px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'dustPuff 0.8s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Team Standings Summary List */}
        {teamLeaderboard.length > 2 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={16} color="#D97706" /> ตารางอันดับพลังชักเย่อรวมทุกทีม:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {teamLeaderboard.map((team, rankIdx) => {
                const maxScore = teamLeaderboard[0]?.score || 1;
                const percent = Math.round((team.score / maxScore) * 100);

                return (
                  <div
                    key={team.id || rankIdx}
                    style={{
                      background: '#FFFFFF',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: `2px solid ${team.color || '#CBD5E1'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: rankIdx === 0 ? '#F59E0B' : '#E2E8F0', color: rankIdx === 0 ? '#FFFFFF' : '#475569', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          #{rankIdx + 1}
                        </span>
                        {team.name}
                      </span>
                      <span style={{ fontWeight: 900, color: team.color || '#2563EB', fontSize: '0.95rem' }}>
                        {team.score.toLocaleString()} Pts
                      </span>
                    </div>

                    {/* Progress Bar relative to leader */}
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: team.color || '#2563EB',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

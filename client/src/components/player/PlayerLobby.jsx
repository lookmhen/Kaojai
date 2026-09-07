import React from 'react';
import { Users, Clock, UsersRound, Check, CheckCircle2, LogOut } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle';

export const PlayerLobby = ({
  player,
  totalPlayers,
  mode,
  teamsEnabled = false,
  teams = [],
  onAssignTeam
}) => {
  const currentTeam = teams.find(t => t.id === player?.teamId);

  return (
    <div style={{ maxWidth: '460px', margin: '30px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop" style={{ position: 'relative', padding: '28px 20px' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <SoundToggle size={16} style={{ width: '34px', height: '34px' }} />
        </div>

        {/* Player Profile */}
        <div
          style={{
            margin: '12px auto 16px auto',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: '#F8FAFC',
            padding: '5px',
            border: currentTeam ? `3px solid ${currentTeam.color}` : '3px solid var(--accent-earth-blue)',
            boxShadow: currentTeam ? `0 4px 14px ${currentTeam.color}33` : 'none',
            transition: 'all 0.2s'
          }}
        >
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
          />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
          {player.name}
        </h2>

        {/* Team Status Badge */}
        {teamsEnabled ? (
          <div style={{ marginBottom: '16px' }}>
            {currentTeam ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `${currentTeam.color}15`,
                  border: `1.5px solid ${currentTeam.color}`,
                  color: currentTeam.color,
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentTeam.color }} />
                <span>สังกัด: {currentTeam.name}</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FEF3C7',
                  border: '1.5px solid #FCD34D',
                  color: '#B45309',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.82rem'
                }}
              >
                <span>⚠️ คุณยังไม่ได้เลือกทีม</span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--accent-earth-green)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>
            คุณเข้าสู่ห้องสำเร็จแล้ว! 🎉
          </p>
        )}

        {/* ─── Team Selection Section (If teams enabled) ──────────────── */}
        {teamsEnabled && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px 14px',
              marginBottom: '20px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                <UsersRound size={17} color="#7C3AED" /> แตะเลือกทีมของคุณ:
              </div>
              {currentTeam && onAssignTeam && (
                <button
                  type="button"
                  onClick={() => onAssignTeam(player.playerId, null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LogOut size={13} /> ออกจากทีม
                </button>
              )}
            </div>

            {teams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teams.map(team => {
                  const isMyTeam = team.id === player?.teamId;
                  const memberCount = (team.members || []).length;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        if (onAssignTeam && !isMyTeam) {
                          onAssignTeam(player.playerId, team.id);
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isMyTeam ? `${team.color}15` : '#FFFFFF',
                        border: isMyTeam ? `2px solid ${team.color}` : '1.5px solid #E2E8F0',
                        borderLeft: `5px solid ${team.color}`,
                        cursor: isMyTeam ? 'default' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: isMyTeam ? `0 2px 8px ${team.color}22` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isMyTeam ? team.color : 'var(--text-main)' }}>
                            {team.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            สมาชิก {memberCount} คน
                          </div>
                        </div>
                      </div>

                      {isMyTeam ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: team.color,
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}
                        >
                          <Check size={14} /> ทีมคุณ
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}
                        >
                          เข้าทีมนี้
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                วิทยากรยังไม่ได้สร้างทีม กรุณารอสักครู่...
              </div>
            )}
          </div>
        )}

        {/* Total Players Count */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 20px', borderRadius: '30px', marginBottom: '20px' }}>
          <Users size={18} color="var(--accent-earth-orange)" />
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
            ผู้เข้าร่วมทั้งหมด: <strong style={{ color: 'var(--accent-earth-orange)', fontSize: '1.1rem' }}>{totalPlayers}</strong> คน
          </span>
        </div>

        {/* Waiting Box */}
        <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '18px 14px' }}>
          <Clock size={26} color="var(--accent-earth-blue)" style={{ marginBottom: '6px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {mode === 'PULSE' ? 'โหมด Training Pulse' : 'รอวิทยากรเริ่มเกม (Waiting for Host...)'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            หน้าจอจะอัปเดตอัตโนมัติเมื่อ Host เริ่มกิจกรรม ✨
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { generateQRCodeSVG } from '../../utils/qrcode';
import { Play, Users, BookOpen, QrCode, Shuffle, Plus, Trash2, UsersRound, ToggleLeft, ToggleRight, X, UserMinus, Hand } from 'lucide-react';

const TEAM_COLOR_PRESETS = [
  '#E11D48', '#2563EB', '#D97706', '#059669', '#7C3AED', '#0891B2'
];

export const HostLobby = ({
  pin, players, counts, onStartQuiz,
  teamsEnabled = false, teams = [],
  onToggleTeams, onAutoAssignTeams, onCreateTeam, onRemoveTeam, onAssignTeam
}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLOR_PRESETS[0]);
  const [dragOverTeamId, setDragOverTeamId] = useState(null);
  const [isDragOverUnassign, setIsDragOverUnassign] = useState(false);

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
          if (data.quizzes.length > 0) setSelectedQuizId(data.quizzes[0].id);
        }
      })
      .catch(err => console.error('Fetch quizzes error:', err));
  }, []);

  const joinUrl = `${window.location.origin}/?pin=${pin}`;
  const qrCodeImgSrc = generateQRCodeSVG(joinUrl, 180);

  const connectedPlayers = players.filter(p => p.isConnected !== false);

  // Build teamId -> team map for quick lookup
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const handleCreateTeamSubmit = () => {
    if (!newTeamName.trim()) return;
    onCreateTeam(newTeamName.trim(), newTeamColor);
    setNewTeamName('');
    setNewTeamColor(TEAM_COLOR_PRESETS[teams.length % TEAM_COLOR_PRESETS.length]);
    setShowCreateTeam(false);
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '30px auto', padding: '0 24px' }}>

      {/* Top Card: QR + PIN + Quiz Select + Start */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {/* QR Code */}
          <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15,23,42,0.05)', textAlign: 'center' }}>
            <img src={qrCodeImgSrc} alt="QR Code Join Room" style={{ width: '160px', height: '160px', borderRadius: '8px', display: 'block' }} />
            <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <QrCode size={14} color="var(--accent-earth-blue)" /> สแกนเข้าห้องได้เลย
            </div>
          </div>

          {/* PIN */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', fontWeight: 700 }}>
              หรือเข้าเว็บกรอก GAME PIN:
            </h2>
            <div style={{ fontSize: '4.8rem', fontWeight: 900, color: 'var(--accent-earth-orange)', letterSpacing: '8px', lineHeight: 1 }}>
              {pin}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
              URL: <span style={{ color: 'var(--accent-earth-blue)', fontWeight: 700 }}>{window.location.host}</span>
            </p>
          </div>
        </div>

        {/* Quiz Set Selection */}
        <div style={{ maxWidth: '500px', margin: '28px auto 16px auto', textAlign: 'left' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BookOpen size={16} color="var(--accent-earth-blue)" /> เลือกชุดคำถาม (Quiz Set):
          </label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: '12px', background: '#F8FAFC', color: 'var(--text-main)', border: '1px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }}
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title} ({q.questions.length} ข้อ)</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onStartQuiz(selectedQuizId)}
          disabled={connectedPlayers.length === 0}
          style={{
            padding: '16px 44px', fontSize: '1.3rem', fontWeight: 800, borderRadius: '50px',
            background: connectedPlayers.length > 0 ? 'var(--accent-earth-orange)' : '#E2E8F0',
            color: connectedPlayers.length > 0 ? '#FFFFFF' : '#94A3B8',
            boxShadow: connectedPlayers.length > 0 ? '0 4px 16px rgba(192,86,33,0.3)' : 'none',
            display: 'inline-flex', alignItems: 'center', gap: '12px', marginTop: '12px',
            cursor: connectedPlayers.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Play size={24} />
          {connectedPlayers.length === 0 ? 'รอผู้เข้าร่วมสแกนเข้าห้อง...' : `เริ่มเกม (${connectedPlayers.length} คนเข้าร่วมแล้ว)`}
        </button>
      </div>

      {/* ─── Team Section ─────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: teamsEnabled ? '20px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UsersRound size={22} color={teamsEnabled ? '#7C3AED' : '#94A3B8'} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>โหมดทีม (Team Mode)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {teamsEnabled ? `เปิดอยู่ · ${teams.length} ทีม (ลากหรือกดเลือกย้ายทีมได้)` : 'ปิดอยู่ · ทุกคนแข่งแบบเดี่ยว'}
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggleTeams(!teamsEnabled)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem',
              background: teamsEnabled ? '#F5F3FF' : '#F8FAFC',
              border: teamsEnabled ? '1.5px solid #7C3AED' : '1.5px solid #CBD5E1',
              color: teamsEnabled ? '#7C3AED' : '#64748B',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {teamsEnabled
              ? <><ToggleRight size={20} /> ปิดโหมดทีม</>
              : <><ToggleLeft size={20} /> เปิดโหมดทีม</>
            }
          </button>
        </div>

        {/* Team Management Panel (visible only when teamsEnabled) */}
        {teamsEnabled && (
          <div>
            {/* Action Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => onAutoAssignTeams(teams.length || 2)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#1D4ED8', cursor: 'pointer'
                }}
              >
                <Shuffle size={16} /> สุ่มแบ่งทีมอัตโนมัติ
              </button>

              <button
                type="button"
                onClick={() => setShowCreateTeam(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#7C3AED', cursor: 'pointer'
                }}
              >
                <Plus size={16} /> สร้างทีมใหม่
              </button>

              {/* Drag instruction notice */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', padding: '6px 12px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                <Hand size={14} color="#7C3AED" /> สามารถลาก Avatar ผู้เล่นมาหย่อนใส่กล่องทีม หรือกดเลือกจากเมนูได้
              </div>
            </div>

            {/* Create Team Form */}
            {showCreateTeam && (
              <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ชื่อทีม</label>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="เช่น ทีมแดง"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTeamSubmit()}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem', background: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>สี</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {TEAM_COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTeamColor(c)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', background: c, border: newTeamColor === c ? '3px solid #1E293B' : '2px solid #FFF',
                          boxShadow: newTeamColor === c ? '0 0 0 2px ' + c : 'none', cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateTeamSubmit}
                  disabled={!newTeamName.trim()}
                  style={{ padding: '9px 18px', borderRadius: '10px', background: newTeamName.trim() ? '#7C3AED' : '#E2E8F0', color: '#FFF', fontWeight: 700, fontSize: '0.88rem', cursor: newTeamName.trim() ? 'pointer' : 'not-allowed' }}
                >
                  สร้างทีม
                </button>
                <button type="button" onClick={() => setShowCreateTeam(false)} style={{ padding: '9px', borderRadius: '10px', background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Team Cards (Drop Zones) */}
            {teams.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
                {teams.map(team => {
                  const isOver = dragOverTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTeamId(team.id);
                      }}
                      onDragLeave={() => setDragOverTeamId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTeamId(null);
                        const pId = e.dataTransfer.getData('text/plain');
                        if (pId && onAssignTeam) {
                          onAssignTeam(pId, team.id);
                        }
                      }}
                      style={{
                        background: isOver ? `${team.color}15` : '#FFFFFF',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        border: isOver ? `2.5px dashed ${team.color}` : `1.5px solid ${team.color}33`,
                        borderLeft: `5px solid ${team.color}`,
                        boxShadow: isOver ? `0 6px 18px ${team.color}33` : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{team.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveTeam(team.id)}
                          title="ลบทีม"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Member avatars */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '36px', alignItems: 'center' }}>
                        {(team.members || []).map(m => (
                          <div
                            key={m.playerId}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', m.playerId)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: `${team.color}18`, borderRadius: '20px', padding: '3px 8px 3px 3px',
                              cursor: 'grab'
                            }}
                            title="ลากไปทีมอื่นได้"
                          >
                            <img
                              src={`/avatars/${m.avatar || '0291dcc0ce.svg'}`}
                              alt={m.name}
                              onError={e => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                              style={{ width: '22px', height: '22px', borderRadius: '50%', border: `1.5px solid ${team.color}` }}
                            />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAssignTeam) onAssignTeam(m.playerId, null);
                              }}
                              title="นำออกจากทีม"
                              style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {(team.members || []).length === 0 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                            {isOver ? 'ปล่อยเพื่อเพิ่มลงทีมนี้' : 'ลากผู้เล่นมาวางที่นี่'}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {(team.members || []).length} คน
                      </div>
                    </div>
                  );
                })}

                {/* Dropzone for Unassign (Remove from team) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverUnassign(true);
                  }}
                  onDragLeave={() => setIsDragOverUnassign(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverUnassign(false);
                    const pId = e.dataTransfer.getData('text/plain');
                    if (pId && onAssignTeam) {
                      onAssignTeam(pId, null);
                    }
                  }}
                  style={{
                    background: isDragOverUnassign ? '#FEF2F2' : '#F8FAFC',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: isDragOverUnassign ? '2px dashed #EF4444' : '1.5px dashed #CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '6px',
                    color: isDragOverUnassign ? '#EF4444' : '#94A3B8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UserMinus size={22} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    {isDragOverUnassign ? 'ปล่อยเพื่อนำออกจากทีม' : 'ลากมาที่นี่เพื่อนำออกจากทีม'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                กด <strong>สร้างทีมใหม่</strong> หรือ <strong>สุ่มแบ่งทีมอัตโนมัติ</strong> เพื่อเริ่มต้น
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Participant Avatar Wall ──────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--accent-earth-blue)" /> ผู้เข้าร่วมกิจกรรม ({connectedPlayers.length} คน)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {teamsEnabled ? 'ลากการ์ดผู้เล่นไปวางในทีม หรือเลือกทีมจากเมนูด้านล่าง' : 'รูป Avatar และชื่อจะแสดงผลทันทีเมื่อ Join'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
          {connectedPlayers.map((p) => {
            const team = teamsEnabled && p.teamId ? teamMap[p.teamId] : null;
            return (
              <div
                key={p.playerId}
                draggable={teamsEnabled}
                onDragStart={(e) => {
                  if (teamsEnabled) {
                    e.dataTransfer.setData('text/plain', p.playerId);
                  }
                }}
                className="glass-card animate-pop"
                style={{
                  textAlign: 'center', padding: '14px 10px',
                  border: team ? `1.5px solid ${team.color}44` : '1px solid #E2E8F0',
                  borderTop: team ? `4px solid ${team.color}` : '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  cursor: teamsEnabled ? 'grab' : 'default',
                  userSelect: 'none'
                }}
              >
                <img
                  src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                  alt={p.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%', marginBottom: '8px',
                    border: team ? `2px solid ${team.color}` : '2px solid var(--accent-earth-blue)',
                    background: '#F8FAFC'
                  }}
                />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-word', marginBottom: '4px' }}>
                  {p.name}
                </div>

                {/* Team Assignment Selector / Badge */}
                {teamsEnabled && (
                  <div style={{ marginTop: '6px' }}>
                    <select
                      value={p.teamId || ''}
                      onChange={(e) => {
                        const targetTeamId = e.target.value || null;
                        if (onAssignTeam) {
                          onAssignTeam(p.playerId, targetTeamId);
                        }
                      }}
                      style={{
                        width: '100%',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '4px 6px',
                        borderRadius: '8px',
                        border: team ? `1.5px solid ${team.color}` : '1px solid #CBD5E1',
                        background: team ? `${team.color}14` : '#F8FAFC',
                        color: team ? team.color : '#64748B',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">— ไม่มีทีม —</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

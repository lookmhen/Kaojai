import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker, getRandomAvatar } from './AvatarPicker';
import { LogIn, Crown, BookOpen, Gamepad2, MonitorPlay, ArrowLeft, Rocket, Sparkles, Tv, Users } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost, onResumeRoom, onOpenTeacherBackoffice }) => {
  const { socket, session, saveSessionData } = useSocket();
  
  // Internal Screen State: 'MODE_SELECT' or 'PLAYER_FORM'
  const [screen, setScreen] = useState('MODE_SELECT');

  const [pin, setPin] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pin') || session?.pin || '';
  });
  const [name, setName] = useState(() => session?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => session?.avatar || getRandomAvatar());
  const [claimedPlayerId, setClaimedPlayerId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [hasPretestRoster, setHasPretestRoster] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active sessions for teacher to resume
  useEffect(() => {
    if (!socket) return;
    socket.emit('get_active_sessions', (res) => {
      if (res && res.success && Array.isArray(res.sessions)) {
        setActiveSessions(res.sessions);
      }
    });
  }, [socket, screen]);

  // Fetch roster when 6-digit PIN is entered
  useEffect(() => {
    if (!socket || !pin || pin.trim().length !== 6) {
      setRoster([]);
      setHasPretestRoster(false);
      return;
    }

    socket.emit('get_roster', { pin: pin.trim() }, (res) => {
      if (res && res.success && Array.isArray(res.roster) && res.roster.length > 0) {
        setRoster(res.roster);
        setHasPretestRoster(Boolean(res.hasPretest));
      } else {
        setRoster([]);
        setHasPretestRoster(false);
      }
    });
  }, [socket, pin]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryPin = urlParams.get('pin');
    const effectivePin = queryPin || session?.pin;

    if (queryPin && queryPin.length === 6) {
      setPin(queryPin);
      setScreen('PLAYER_FORM');
    }

    if (session?.name && !name) {
      setName(session.name);
    }
    if (session?.avatar && !selectedAvatar) {
      setSelectedAvatar(session.avatar);
    }

    // Auto-reconnect if arriving via QR scan for the room we were already playing in
    if (socket && queryPin && queryPin.length === 6 && session?.pin === queryPin && session?.name && session?.playerId && !session?.isHost) {
      setIsLoading(true);
      socket.emit('join_room', {
        pin: queryPin,
        name: session.name,
        avatar: session.avatar,
        playerId: session.playerId
      }, (response) => {
        setIsLoading(false);
        if (response && response.success) {
          onJoined(response);
        }
      });
    }
  }, [socket, session]);

  const handleClaimRosterPlayer = (rosterPlayer) => {
    setName(rosterPlayer.name);
    setSelectedAvatar(rosterPlayer.avatar || '0291dcc0ce.svg');
    setClaimedPlayerId(rosterPlayer.playerId);
    setIsManualInput(false);
    setError('');

    // Instant One-Click Join with claimed identity
    setIsLoading(true);
    socket.emit('join_room', {
      pin: pin.trim(),
      name: rosterPlayer.name,
      avatar: rosterPlayer.avatar || '0291dcc0ce.svg',
      playerId: rosterPlayer.playerId
    }, (response) => {
      setIsLoading(false);
      if (response && response.success) {
        saveSessionData({
          pin: response.pin,
          playerId: response.player.playerId,
          name: response.player.name,
          avatar: response.player.avatar,
          isHost: false
        });
        onJoined(response);
      } else {
        setError(response?.message || 'ไม่สามารถเข้าร่วมห้องได้');
      }
    });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!pin.trim() || pin.trim().length !== 6) {
      setError('กรุณากรอกรหัส PIN 6 หลัก');
      return;
    }

    if (!name.trim()) {
      setError('กรุณากรอกชื่อของคุณ');
      return;
    }

    setIsLoading(true);

    const existingPlayerId = claimedPlayerId || ((session?.pin === pin.trim() && session?.playerId) ? session.playerId : undefined);

    socket.emit('join_room', {
      pin: pin.trim(),
      name: name.trim().substring(0, 30),
      avatar: selectedAvatar,
      playerId: existingPlayerId
    }, (response) => {
      setIsLoading(false);
      if (response && response.success) {
        saveSessionData({
          pin: response.pin,
          playerId: response.player.playerId,
          name: response.player.name,
          avatar: response.player.avatar,
          isHost: false
        });
        onJoined(response);
      } else {
        setError(response?.message || 'ไม่สามารถเข้าร่วมห้องได้ กรุณาตรวจสอบ PIN');
      }
    });
  };

  if (screen === 'PLAYER_FORM') {
    return (
      <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setScreen('MODE_SELECT')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '30px',
              padding: '8px 18px',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <ArrowLeft size={18} color="var(--accent-earth-blue)" /> กลับสู่หน้าเลือกบทบาท
          </button>
        </div>

        <div className="glass-card animate-pop" style={{ padding: '32px 24px', borderTop: '5px solid #138808' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ background: '#F0FDF4', display: 'inline-flex', padding: '14px', borderRadius: '50%', border: '1px solid #BBF7D0', marginBottom: '12px' }}>
              <Gamepad2 size={34} color="#138808" />
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)' }}>
              เข้าร่วมตอบคำถาม (Join Game)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              กรอก Game PIN และตั้งชื่อ Nickname เพื่อเข้าเล่น
            </p>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {session?.name && session?.pin === pin && (
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1.5px solid #93C5FD',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.86rem', color: '#1E40AF', fontWeight: 700, marginBottom: '6px' }}>
                ✨ ตรวจพบเซสชันเดิมของคุณในห้องนี้
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                <img
                  src={`/avatars/${session.avatar || '0291dcc0ce.svg'}`}
                  alt={session.name}
                  onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #2563EB' }}
                />
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{session.name}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                }}
              >
                {isLoading ? 'กำลังเข้าสู่ห้อง...' : `🚀 แตะเพื่อกลับเข้าเล่นต่อทันที (ในชื่อ ${session.name})`}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Game PIN (รหัส 6 หลัก):
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="เช่น 123456"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: 'var(--text-main)',
                  fontWeight: 800
                }}
              />
            </div>

            {/* Roster Selection for Pre-test / Retest participants */}
            {roster.length > 0 && !isManualInput && (
              <div
                className="animate-pop"
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '16px',
                  padding: '16px',
                  marginTop: '4px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={18} /> เลือกชื่อของคุณเพื่อเข้าเล่นต่อทันที (1-Click)
                  </span>
                  <span style={{ fontSize: '0.78rem', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    {roster.length} คน
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#166534', margin: '0 0 12px 0' }}>
                  แตะที่ชื่อของคุณเพื่อทำ Post-test ต่อโดยไม่ต้องพิมพ์ใหม่
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    padding: '4px'
                  }}
                >
                  {roster.map((player) => (
                    <button
                      key={player.playerId}
                      type="button"
                      onClick={() => handleClaimRosterPlayer(player)}
                      disabled={isLoading}
                      style={{
                        background: claimedPlayerId === player.playerId ? '#22C55E' : '#FFFFFF',
                        color: claimedPlayerId === player.playerId ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid #BBF7D0',
                        borderRadius: '12px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        fontSize: '0.88rem',
                        fontWeight: 700
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img
                        src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
                        alt={player.name}
                        onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                        style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0 }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsManualInput(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#15803D',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    + ฉันเป็นผู้เรียนใหม่ (ไม่ได้ทำ Pre-test / พิมพ์ชื่อใหม่)
                  </button>
                </div>
              </div>
            )}

            {isManualInput && roster.length > 0 && (
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualInput(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← กลับไปเลือกจากรายชื่อเดิม
                </button>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                ชื่อของคุณ (Nickname):
              </label>
              <input
                type="text"
                maxLength={30}
                placeholder="กรอกชื่อของคุณ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <AvatarPicker selectedAvatar={selectedAvatar} onSelectAvatar={setSelectedAvatar} />

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: '#138808',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(19, 136, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                borderBottom: '4px solid #0B5605'
              }}
            >
              <LogIn size={22} /> {isLoading ? 'กำลังเข้าห้อง...' : 'เข้าร่วมตอบคำถาม (Join Game)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-earth-orange)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
          <Sparkles size={16} /> Interactive Training & Quiz System
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          ยินดีต้อนรับสู่ KaoJai
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '6px', fontWeight: 500 }}>
          โปรดเลือกบทบาทของคุณเพื่อเริ่มต้นใช้งานระบบ
        </p>
      </div>

      {/* MODE SELECTION CARDS: STACKED GRID (TOP & BOTTOM) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* TOP BLOCK: Participant / Join Game Card */}
        <div
          className="glass-card animate-pop"
          style={{
            padding: '28px 32px',
            borderLeft: '8px solid #138808',
            background: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(19, 136, 8, 0.08)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 360px' }}>
            <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '18px', border: '1px solid #BBF7D0', flexShrink: 0 }}>
              <Gamepad2 size={38} color="#138808" />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#138808', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                <Rocket size={14} /> สำหรับผู้เรียน / ผู้เข้าร่วม
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                เข้าร่วมตอบคำถาม (Join Game)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                กรอกรหัส **Game PIN 6 หลัก** หรือสแกน QR Code เพื่อเข้าตอบคำถามสดผ่านสมาร์ทโฟน
              </p>
            </div>
          </div>

          <div style={{ flex: '0 0 auto', minWidth: '220px' }}>
            <button
              type="button"
              onClick={() => setScreen('PLAYER_FORM')}
              style={{
                width: '100%',
                padding: '16px 32px',
                borderRadius: '14px',
                background: '#138808',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(19, 136, 8, 0.35)',
                borderBottom: '4px solid #0B5605',
                cursor: 'pointer'
              }}
            >
              <Rocket size={22} /> เข้าตอบคำถาม
            </button>
          </div>
        </div>

        {/* BOTTOM BLOCK: Teacher / Host Card */}
        <div
          className="glass-card animate-pop"
          style={{
            padding: '28px 32px',
            borderLeft: '8px solid var(--accent-earth-blue)',
            background: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: activeSessions.length > 0 ? '20px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 360px' }}>
              <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '18px', border: '1px solid #BFDBFE', flexShrink: 0 }}>
                <MonitorPlay size={38} color="var(--accent-earth-blue)" />
              </div>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-earth-blue)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  <Tv size={14} /> สำหรับวิทยากร / ผู้สอน
                </div>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                  เปิดเกมสดขึ้นจอใหญ่ (Host Dashboard)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  สร้างห้องกิจกรรมใหม่ แสดง PIN & QR Code สลับโหมด Quiz & Pulse หรือเข้าคลังข้อสอบ
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onSwitchToHost?.()}
                style={{
                  padding: '14px 24px',
                  borderRadius: '12px',
                  background: 'var(--accent-earth-blue)',
                  color: '#FFFFFF',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
                  borderBottom: '4px solid #172554',
                  cursor: 'pointer'
                }}
              >
                <Tv size={20} /> สร้างห้องกิจกรรมใหม่
              </button>

              <button
                type="button"
                onClick={() => onOpenTeacherBackoffice?.()}
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <BookOpen size={18} color="var(--accent-earth-blue)" /> คลังคำถาม
              </button>
            </div>
          </div>

          {/* List of Resumable / Pending Sessions */}
          {activeSessions.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-earth-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} /> ห้องที่เปิดค้างไว้ / รอทำ Post-test:
                </span>
                <span style={{ fontSize: '0.78rem', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  {activeSessions.length} ห้อง
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {activeSessions.map((sess) => (
                  <div
                    key={sess.pin}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 900, color: 'var(--accent-earth-orange)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                          PIN: {sess.pin}
                        </span>
                        {sess.hasPretest && (
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 700, padding: '1px 6px', borderRadius: '6px' }}>
                            Pre-test ✓
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {sess.quizTitle} • {sess.pretestPlayerCount || sess.rosterCount || 0} คน
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onResumeRoom?.(sess.pin)}
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                      }}
                    >
                      ⚡ เปิดห้องต่อ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

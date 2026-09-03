import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';
import { LogIn, Crown, BookOpen, Users, GraduationCap, Play } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost, onOpenTeacherBackoffice }) => {
  const { socket, saveSessionData } = useSocket();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('0291dcc0ce.svg');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Parse ?pin=XXXXXX from URL Query String if present
    const urlParams = new URLSearchParams(window.location.search);
    const queryPin = urlParams.get('pin');
    if (queryPin && queryPin.length === 6) {
      setPin(queryPin);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
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

    socket.emit('join_room', {
      pin: pin.trim(),
      name: name.trim().substring(0, 30),
      avatar: selectedAvatar
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

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
      {/* App Header Title */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(90deg, #FFD600, #FF4081, #00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
          KaoJai Interactive Pulse
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.15rem', marginTop: '6px', fontWeight: 500 }}>
          เลือกบทบาทเพื่อเริ่มใช้งานระบบถาม-ตอบเรียลไทม์ และเช็กความเข้าใจ
        </p>
      </div>

      {/* 2 Big Column Selection Box Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
        
        {/* COLUMN 1: Student / Participant Box */}
        <div className="glass-card animate-pop" style={{ display: 'flex', flexDirection: 'column', borderTop: '6px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0, 229, 255, 0.2)', padding: '12px', borderRadius: '16px', border: '1px solid var(--accent-cyan)' }}>
              <Users size={28} color="var(--accent-cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                สำหรับผู้เรียน / ผู้เข้าร่วม
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                กรอก PIN หรือสแกน QR Code เพื่อเข้าเล่น
              </span>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 82, 82, 0.25)', border: '1px solid #ff5252', color: '#ff8a80', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
                  padding: '12px',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  borderRadius: '12px',
                  border: '2px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontWeight: 800
                }}
              />
            </div>

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
                  fontSize: '1.05rem',
                  borderRadius: '12px',
                  border: '2px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff'
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
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'auto'
              }}
            >
              <LogIn size={20} /> {isLoading ? 'กำลังเข้าห้อง...' : 'เข้าร่วมตอบคำถาม (Join Game)'}
            </button>
          </form>
        </div>

        {/* COLUMN 2: Teacher / Host Box */}
        <div className="glass-card animate-pop" style={{ display: 'flex', flexDirection: 'column', borderTop: '6px solid var(--accent-yellow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255, 214, 0, 0.2)', padding: '12px', borderRadius: '16px', border: '1px solid var(--accent-yellow)' }}>
              <GraduationCap size={28} color="var(--accent-yellow)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                สำหรับวิทยากร / ผู้สอน
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                สร้างห้องกิจกรรม หรือจัดการคลังคำถาม
              </span>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
            ควบคุมเกมขึ้นจอใหญ่ (Projector Dashboard), สลับโหมด Quiz & Pulse เรียลไทม์ และปรับแต่งชุดคำถามได้อย่างอิสระ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
            {/* Big Action Button 1: Create Host Room */}
            <button
              type="button"
              onClick={onSwitchToHost}
              style={{
                width: '100%',
                padding: '20px 16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffd600 0%, #ffab00 100%)',
                color: '#000',
                fontSize: '1.2rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(255, 214, 0, 0.4)'
              }}
            >
              <Crown size={24} /> สร้างห้องกิจกรรมใหม่ (Create Host Room)
            </button>

            {/* Big Action Button 2: Teacher Backoffice */}
            <button
              type="button"
              onClick={onOpenTeacherBackoffice}
              style={{
                width: '100%',
                padding: '18px 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <BookOpen size={22} color="var(--accent-cyan)" /> ระบบจัดการชุดคำถาม (Teacher Backoffice)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

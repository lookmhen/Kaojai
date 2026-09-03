import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';
import { LogIn, Crown, BookOpen, Users, GraduationCap } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost, onOpenTeacherBackoffice }) => {
  const { socket, saveSessionData } = useSocket();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('0291dcc0ce.svg');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-earth-blue)', letterSpacing: '0.5px' }}>
          KaoJai Interactive Pulse
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '6px', fontWeight: 500 }}>
          เลือกบทบาทเพื่อเริ่มใช้งานระบบถาม-ตอบเรียลไทม์ และเช็กความเข้าใจในการฝึกอบรม
        </p>
      </div>

      {/* 2 Column Selection Box Layout (60-30-10 Earth Tones) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
        
        {/* COLUMN 1: Student Box */}
        <div className="glass-card animate-pop" style={{ display: 'flex', flexDirection: 'column', borderTop: '6px solid var(--accent-earth-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
              <Users size={26} color="var(--accent-earth-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                สำหรับผู้เรียน / ผู้เข้าร่วม
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                กรอก PIN หรือสแกน QR Code เพื่อเข้าเล่น
              </span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
                  fontSize: '1.4rem',
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

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
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
                borderRadius: '14px',
                background: 'var(--accent-earth-blue)',
                color: '#FFFFFF',
                fontSize: '1.15rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(30, 58, 138, 0.2)',
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

        {/* COLUMN 2: Teacher Box */}
        <div className="glass-card animate-pop" style={{ display: 'flex', flexDirection: 'column', borderTop: '6px solid var(--accent-earth-orange)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#FFF7ED', padding: '12px', borderRadius: '14px', border: '1px solid #FFEDD5' }}>
              <GraduationCap size={26} color="var(--accent-earth-orange)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                สำหรับวิทยากร / ผู้สอน
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                สร้างห้องกิจกรรม หรือจัดการคลังคำถาม
              </span>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
            ควบคุมเกมขึ้นจอใหญ่ (Projector Dashboard), สลับโหมด Quiz & Pulse เรียลไทม์ และปรับแต่งชุดคำถามได้อย่างอิสระ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
            {/* Action 1: Create Host Room */}
            <button
              type="button"
              onClick={onSwitchToHost}
              style={{
                width: '100%',
                padding: '18px 16px',
                borderRadius: '14px',
                background: 'var(--accent-earth-orange)',
                color: '#FFFFFF',
                fontSize: '1.15rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(192, 86, 33, 0.2)'
              }}
            >
              <Crown size={22} /> สร้างห้องกิจกรรมใหม่ (Create Host Room)
            </button>

            {/* Action 2: Teacher Backoffice */}
            <button
              type="button"
              onClick={onOpenTeacherBackoffice}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: 'var(--text-main)',
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <BookOpen size={20} color="var(--accent-earth-blue)" /> ระบบจัดการชุดคำถาม (Teacher Backoffice)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

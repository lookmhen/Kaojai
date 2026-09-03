import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';
import { LogIn, Crown, BookOpen, Gamepad2, MonitorPlay, ArrowLeft, Rocket, Sparkles, Tv, Users } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost, onOpenTeacherBackoffice }) => {
  const { socket, saveSessionData } = useSocket();
  
  // Internal Screen State: 'MODE_SELECT' or 'PLAYER_FORM'
  const [screen, setScreen] = useState('MODE_SELECT');

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
      setScreen('PLAYER_FORM');
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: Participant / Join Card */}
        <div
          className="glass-card animate-pop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 28px',
            borderTop: '6px solid #138808',
            background: '#FFFFFF',
            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
              <Gamepad2 size={34} color="#138808" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#138808', textTransform: 'uppercase', letterSpacing: '1px' }}>
                สำหรับผู้เรียน
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                เข้าร่วมตอบคำถาม
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
            สำหรับผู้เข้าร่วมการอบรมที่ต้องการกรอกรหัส **Game PIN 6 หลัก** หรือสแกน **QR Code** เพื่อเข้าเล่นเกมตอบคำถามเรียลไทม์
          </p>

          <button
            type="button"
            onClick={() => setScreen('PLAYER_FORM')}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: '12px',
              background: '#138808',
              color: '#FFFFFF',
              fontSize: '1.25rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(19, 136, 8, 0.3)',
              marginTop: 'auto',
              borderBottom: '4px solid #0B5605'
            }}
          >
            <Rocket size={22} /> Join / เข้าตอบคำถาม
          </button>
        </div>

        {/* RIGHT COLUMN: Teacher / Host Card */}
        <div
          className="glass-card animate-pop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 28px',
            borderTop: '6px solid var(--accent-earth-blue)',
            background: '#FFFFFF',
            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#EFF6FF', padding: '14px', borderRadius: '16px', border: '1px solid #BFDBFE' }}>
              <MonitorPlay size={34} color="var(--accent-earth-blue)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-earth-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                สำหรับวิทยากร
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                เปิดเกมสดขึ้นจอใหญ่
              </h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
            สำหรับวิทยากร/ผู้สอนเพื่อสร้างห้องกิจกรรม แสดง PIN บนจอใหญ่ สลับโหมด Quiz & Pulse และประเมินผลผู้เรียนสด
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <button
              type="button"
              onClick={onSwitchToHost}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '12px',
                background: 'var(--accent-earth-blue)',
                color: '#FFFFFF',
                fontSize: '1.25rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
                borderBottom: '4px solid #172554'
              }}
            >
              <Tv size={22} /> Teach / สร้างห้องกิจกรรมสด
            </button>

            <button
              type="button"
              onClick={onOpenTeacherBackoffice}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <BookOpen size={18} color="var(--accent-earth-blue)" /> ระบบจัดการคลังคำถาม (Teacher Backoffice)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

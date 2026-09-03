import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';
import { LogIn, Crown } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost }) => {
  const { socket, saveSessionData } = useSocket();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('0291dcc0ce.svg');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 16px' }}>
      <div className="glass-card animate-pop" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(90deg, #A29BFE, #6C5CE7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KaoJai เข้าห้องเล่น
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
            เข้าร่วมตอบคำถามเรียลไทม์และเช็กความเข้าใจ
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#ff7675', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
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
                padding: '14px',
                fontSize: '1.4rem',
                textAlign: 'center',
                letterSpacing: '4px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontWeight: 700
              }}
            />
          </div>

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ชื่อของคุณ (Nickname):
            </label>
            <input
              type="text"
              maxLength={30}
              placeholder="กรอกชื่อชวนสนุก..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '1.1rem',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
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
              background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px'
            }}
          >
            <LogIn size={20} /> {isLoading ? 'กำลังเข้าห้อง...' : 'เข้าร่วมเล่น (Join)'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={onSwitchToHost}
            style={{
              background: 'transparent',
              color: 'var(--accent-yellow)',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'underline'
            }}
          >
            <Crown size={16} /> คุณเป็นวิทยากร/โฮสต์? สร้างห้องตรงนี้
          </button>
        </div>
      </div>
    </div>
  );
};

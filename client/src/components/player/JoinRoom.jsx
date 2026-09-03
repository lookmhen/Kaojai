import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AvatarPicker } from './AvatarPicker';
import { LogIn, BookOpen, Play, ArrowLeft } from 'lucide-react';

export const JoinRoom = ({ onJoined, onSwitchToHost, onOpenTeacherBackoffice }) => {
  const { socket, saveSessionData } = useSocket();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('0291dcc0ce.svg');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryPin = urlParams.get('pin');
    if (queryPin && queryPin.length === 6) {
      setPin(queryPin);
      setShowJoinForm(true);
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
    <div style={{ maxWidth: '980px', margin: '30px auto', padding: '0 20px' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          Choose a way to play KaoJai
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '6px', fontWeight: 500 }}>
          เลือกรูปแบบการใช้งานเพื่อเริ่มต้นกิจกรรมตอบคำถามสดหรือเช็กความเข้าใจ
        </p>
      </div>

      {/* 2 Card Grid matching user screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
        
        {/* CARD 1: TEACH / HOST (Live Classrooms) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#EBEBEF',
              border: '1px solid #D1D5DB',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '360px'
            }}
          >
            {/* Red Diagonal Ribbon */}
            <div className="ribbon-badge">
              For live training
            </div>

            {/* Illustration graphic (Laptop + Smartphones) */}
            <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0 16px 0' }}>
              <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Laptop Base */}
                <rect x="25" y="30" width="140" height="90" rx="8" fill="#2D3748" />
                <rect x="32" y="37" width="126" height="74" rx="4" fill="#1A202C" />
                {/* Laptop Screen Elements */}
                <rect x="38" y="44" width="114" height="20" rx="4" fill="#3B82F6" />
                <rect x="38" y="70" width="54" height="18" rx="4" fill="#E21B3C" />
                <rect x="98" y="70" width="54" height="18" rx="4" fill="#1368CE" />
                <rect x="38" y="92" width="54" height="15" rx="4" fill="#D89E00" />
                <rect x="98" y="92" width="54" height="15" rx="4" fill="#26890C" />
                {/* Laptop Keyboard Lip */}
                <path d="M15 120H175L185 126H5L15 120Z" fill="#4A5568" />
                
                {/* Smartphone 1 */}
                <rect x="150" y="55" width="34" height="65" rx="6" fill="#1A202C" stroke="#4A5568" strokeWidth="2" />
                <rect x="153" y="60" width="28" height="52" rx="3" fill="#EDF2F7" />
                <rect x="155" y="64" width="11" height="20" rx="2" fill="#E21B3C" />
                <rect x="168" y="64" width="11" height="20" rx="2" fill="#1368CE" />
                <rect x="155" y="88" width="11" height="20" rx="2" fill="#D89E00" />
                <rect x="168" y="88" width="11" height="20" rx="2" fill="#26890C" />

                {/* Smartphone 2 */}
                <rect x="175" y="68" width="30" height="58" rx="5" fill="#2D3748" />
                <rect x="178" y="72" width="24" height="46" rx="2" fill="#EDF2F7" />
                <rect x="180" y="75" width="9" height="18" rx="2" fill="#E21B3C" />
                <rect x="191" y="75" width="9" height="18" rx="2" fill="#1368CE" />
                <rect x="180" y="96" width="9" height="18" rx="2" fill="#D89E00" />
                <rect x="191" y="96" width="9" height="18" rx="2" fill="#26890C" />
              </svg>
            </div>

            {/* Big Green Action Button */}
            <button
              type="button"
              onClick={onSwitchToHost}
              style={{
                width: '80%',
                padding: '14px 20px',
                borderRadius: '8px',
                background: '#138808',
                color: '#FFFFFF',
                fontSize: '1.4rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(19, 136, 8, 0.3)',
                marginTop: 'auto',
                borderBottom: '4px solid #0B5605'
              }}
            >
              Teach
            </button>
          </div>

          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
            Play a live game together with learners over video or in class (เริ่มเกมสดขึ้นจอใหญ่)
          </p>
        </div>

        {/* CARD 2: ASSIGN / JOIN (Participant Self-Paced) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#EBEBEF',
              border: '1px solid #D1D5DB',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '360px'
            }}
          >
            {/* Red Diagonal Ribbon */}
            <div className="ribbon-badge">
              For participants
            </div>

            {/* Illustration graphic (Globe + Mobile devices) */}
            <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0 16px 0' }}>
              <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Globe Circle Background */}
                <circle cx="110" cy="80" r="55" fill="#60A5FA" />
                <path d="M70 70C80 60 100 55 120 65C135 72 155 60 160 75C165 90 140 105 125 110C110 115 90 120 75 105C65 95 60 80 70 70Z" fill="#34D399" />
                
                {/* Laptop Floating */}
                <rect x="40" y="35" width="60" height="38" rx="4" fill="#2D3748" />
                <rect x="44" y="39" width="52" height="30" rx="2" fill="#FFFFFF" />
                <rect x="48" y="44" width="20" height="8" rx="2" fill="#E21B3C" />
                <rect x="72" y="44" width="20" height="8" rx="2" fill="#1368CE" />
                <rect x="48" y="55" width="20" height="8" rx="2" fill="#D89E00" />
                <rect x="72" y="55" width="20" height="8" rx="2" fill="#26890C" />
                
                {/* Smartphone Main */}
                <rect x="140" y="30" width="44" height="80" rx="8" fill="#1A202C" stroke="#CBD5E1" strokeWidth="2" />
                <rect x="144" y="36" width="36" height="68" rx="4" fill="#F8FAFC" />
                <rect x="148" y="42" width="28" height="16" rx="3" fill="#E2E8F0" />
                <rect x="148" y="62" width="12" height="16" rx="2" fill="#E21B3C" />
                <rect x="164" y="62" width="12" height="16" rx="2" fill="#1368CE" />
                <rect x="148" y="82" width="12" height="16" rx="2" fill="#D89E00" />
                <rect x="164" y="82" width="12" height="16" rx="2" fill="#26890C" />
              </svg>
            </div>

            {/* Big Green Action Button */}
            <button
              type="button"
              onClick={() => setShowJoinForm(!showJoinForm)}
              style={{
                width: '80%',
                padding: '14px 20px',
                borderRadius: '8px',
                background: '#138808',
                color: '#FFFFFF',
                fontSize: '1.4rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(19, 136, 8, 0.3)',
                marginTop: 'auto',
                borderBottom: '4px solid #0B5605'
              }}
            >
              {showJoinForm ? 'ซ่อนแบบฟอร์ม' : 'Join'}
            </button>
          </div>

          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
            Assign a challenge or join with room PIN (ผู้เรียนกรอก PIN / สแกน QR เข้าเล่น)
          </p>
        </div>

      </div>

      {/* Expanded Participant PIN Entry Form */}
      {showJoinForm && (
        <div className="glass-card animate-pop" style={{ maxWidth: '500px', margin: '32px auto 0 auto', padding: '28px', borderTop: '5px solid #138808' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📱 เข้าสู่ห้องตอบคำถาม (Join Game)
            </h2>
            <button
              type="button"
              onClick={() => setShowJoinForm(false)}
              style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  padding: '12px',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  borderRadius: '10px',
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
                  borderRadius: '10px',
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
                padding: '14px',
                borderRadius: '10px',
                background: '#138808',
                color: '#FFFFFF',
                fontSize: '1.15rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(19, 136, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              <LogIn size={20} /> {isLoading ? 'กำลังเข้าห้อง...' : 'เข้าร่วมตอบคำถาม (Join Game)'}
            </button>
          </form>
        </div>
      )}

      {/* Secondary Button: Teacher Backoffice */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button
          type="button"
          onClick={onOpenTeacherBackoffice}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '30px',
            padding: '10px 24px',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <BookOpen size={18} color="var(--accent-earth-blue)" /> ระบบจัดการคลังคำถาม (Teacher Backoffice)
        </button>
      </div>
    </div>
  );
};

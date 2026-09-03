import React, { useState, useEffect } from 'react';
import { generateQRCodeSVG } from '../../utils/qrcode';
import { Play, Users, BookOpen, QrCode } from 'lucide-react';

export const HostLobby = ({ pin, players, counts, onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
          if (data.quizzes.length > 0) {
            setSelectedQuizId(data.quizzes[0].id);
          }
        }
      })
      .catch(err => console.error('Fetch quizzes error:', err));
  }, []);

  const joinUrl = `${window.location.origin}/?pin=${pin}`;
  const qrCodeImgSrc = generateQRCodeSVG(joinUrl, 180);

  return (
    <div style={{ maxWidth: '1050px', margin: '30px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {/* QR Code Container */}
          <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', textAlign: 'center' }}>
            <img src={qrCodeImgSrc} alt="QR Code Join Room" style={{ width: '160px', height: '160px', borderRadius: '8px', display: 'block' }} />
            <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <QrCode size={14} color="var(--accent-earth-blue)" /> สแกนเข้าห้องได้เลย
            </div>
          </div>

          {/* PIN Container */}
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
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              borderRadius: '12px',
              background: '#F8FAFC',
              color: 'var(--text-main)',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.questions.length} ข้อ)
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onStartQuiz(selectedQuizId)}
          disabled={players.length === 0}
          style={{
            padding: '16px 44px',
            fontSize: '1.3rem',
            fontWeight: 800,
            borderRadius: '50px',
            background: players.length > 0 ? 'var(--accent-earth-orange)' : '#E2E8F0',
            color: players.length > 0 ? '#FFFFFF' : '#94A3B8',
            boxShadow: players.length > 0 ? '0 4px 16px rgba(192, 86, 33, 0.3)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '12px',
            cursor: players.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Play size={24} /> {players.length === 0 ? 'รอผู้เข้าร่วมสแกนเข้าห้อง...' : `เริ่มเกม (${players.length} คนเข้าร่วมแล้ว)`}
        </button>
      </div>

      {/* Participant Avatar Wall */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--accent-earth-blue)" /> ผู้เข้าร่วมกิจกรรม ({players.length} คน)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            รูป Avatar และชื่อจะแสดงผลทันทีเมื่อ Join
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
          {players.map((p) => (
            <div
              key={p.playerId}
              className="glass-card animate-pop"
              style={{
                textAlign: 'center',
                padding: '14px 10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF'
              }}
            >
              <img
                src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                alt={p.name}
                onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '8px', border: '2px solid var(--accent-earth-blue)', background: '#F8FAFC' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

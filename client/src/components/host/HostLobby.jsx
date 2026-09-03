import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Play, Users, BookOpen } from 'lucide-react';

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

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>
          เข้าเล่นผ่านเบราว์เซอร์ กรอก PIN:
        </h2>
        <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent-yellow)', letterSpacing: '8px', margin: '10px 0', textShadow: '0 0 30px rgba(253, 203, 110, 0.5)' }}>
          {pin}
        </div>

        {/* Quiz Set Selection */}
        <div style={{ maxWidth: '500px', margin: '24px auto', textAlign: 'left' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BookOpen size={16} /> เลือกชุดคำถาม (Quiz Set):
          </label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer'
            }}
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id} style={{ background: '#111d4e', color: '#fff' }}>
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
            padding: '18px 48px',
            fontSize: '1.4rem',
            fontWeight: 800,
            borderRadius: '50px',
            background: players.length > 0 ? 'linear-gradient(135deg, #FF7675 0%, #d63031 100%)' : 'rgba(255,255,255,0.2)',
            color: '#fff',
            boxShadow: players.length > 0 ? '0 10px 30px rgba(255, 118, 117, 0.5)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            cursor: players.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Play size={26} /> {players.length === 0 ? 'รอผู้เข้าร่วมสแกนเข้าห้อง...' : `เริ่มเกม (${players.length} คนเข้าร่วมแล้ว)`}
        </button>
      </div>

      {/* Participant Avatar Wall */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--accent-cyan)" /> ผู้เข้าร่วมกิจกรรม ({players.length} คน)
          </h3>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            รูป Avatar และชื่อจะเด้งขึ้นหน้าจอทันทีเมื่อกด Join
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {players.map((p) => (
            <div
              key={p.playerId}
              className="glass-card animate-pop"
              style={{
                textAlign: 'center',
                padding: '16px 12px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <img
                src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                alt={p.name}
                onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '8px', border: '2px solid var(--primary-purple)' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', wordBreak: 'break-word' }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

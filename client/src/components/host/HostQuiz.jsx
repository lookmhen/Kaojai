import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Users, Clock, ArrowRight, Trophy } from 'lucide-react';

const OPTION_STYLES = [
  { bg: 'var(--choice-red-gradient)', color: '#e74c3c', symbol: '▲' },
  { bg: 'var(--choice-blue-gradient)', color: '#2980b9', symbol: '◆' },
  { bg: 'var(--choice-yellow-gradient)', color: '#f39c12', symbol: '●' },
  { bg: 'var(--choice-green-gradient)', color: '#27ae60', symbol: '■' }
];

export const HostQuiz = ({ question, result, answeredCount, totalPlayers, onNextQuestion, onShowLeaderboard }) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSeconds);

  useEffect(() => {
    setTimeLeft(question.timeLimitSeconds);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        if (prev <= 6) {
          sfx.playTenseTick(prev - 1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question?.id]);

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 24px' }}>
      {/* Top Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
          คำถามที่ {question.questionIndex + 1} / {question.totalQuestions}
        </div>

        {/* Answered / Total Counter Badge */}
        <div className="counter-badge" style={{ fontSize: '1.3rem', padding: '10px 24px' }}>
          <Users size={22} color="var(--accent-yellow)" />
          <span>ตอบแล้ว <span className="highlight" style={{ fontSize: '1.6rem' }}>{answeredCount}</span> / {totalPlayers} คน</span>
        </div>

        {/* Timer Circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '30px', border: '2px solid var(--accent-cyan)' }}>
          <Clock size={24} color="var(--accent-cyan)" />
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: timeLeft <= 5 ? '#e74c3c' : '#fff' }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Question Card (with Optional Image Support) */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px', padding: '32px 24px' }}>
        {question.imageUrl && (
          <div style={{ marginBottom: '16px', overflow: 'hidden', borderRadius: '16px', maxHeight: '280px' }}>
            <img
              src={question.imageUrl}
              alt="Question Illustration"
              style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '16px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.4 }}>
          {question.questionText}
        </h1>
      </div>

      {/* Answer Options / Results Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {question.options.map((opt, idx) => {
          const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
          const isCorrect = result?.correctOptionId === opt.id;
          const count = result?.optionCounts?.[opt.id] || 0;

          return (
            <div
              key={opt.id}
              style={{
                background: styleObj.bg,
                borderRadius: '18px',
                padding: '24px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isCorrect ? '0 0 30px rgba(46, 204, 113, 0.8)' : '0 8px 24px rgba(0,0,0,0.3)',
                border: result && isCorrect ? '4px solid #fff' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{styleObj.symbol}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{opt.text}</span>
                </div>
                {result && (
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, background: 'rgba(0,0,0,0.4)', padding: '4px 14px', borderRadius: '20px' }}>
                    {count} คน
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <button
          type="button"
          onClick={onShowLeaderboard}
          style={{
            padding: '14px 28px',
            borderRadius: '14px',
            background: 'var(--primary-purple)',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Trophy size={20} /> ดู Leaderboard
        </button>

        <button
          type="button"
          onClick={onNextQuestion}
          style={{
            padding: '14px 28px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #00CEC9 0%, #0984e3 100%)',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ข้อถัดไป <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Users, Clock, ArrowRight, Trophy } from 'lucide-react';

const OPTION_STYLES = [
  { bg: 'var(--choice-red-gradient)', color: '#991B1B', symbol: '▲' },
  { bg: 'var(--choice-blue-gradient)', color: '#1E40AF', symbol: '◆' },
  { bg: 'var(--choice-yellow-gradient)', color: '#B45309', symbol: '●' },
  { bg: 'var(--choice-green-gradient)', color: '#166534', symbol: '■' }
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
      {/* Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          คำถามที่ {question.questionIndex + 1} / {question.totalQuestions}
        </div>

        {/* Counter Badge */}
        <div className="counter-badge" style={{ fontSize: '1.15rem', padding: '8px 20px' }}>
          <Users size={20} color="var(--accent-earth-orange)" />
          <span>ตอบแล้ว <span className="highlight" style={{ fontSize: '1.4rem' }}>{answeredCount}</span> / {totalPlayers} คน</span>
        </div>

        {/* Timer Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 18px', borderRadius: '30px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <Clock size={20} color={timeLeft <= 5 ? '#991B1B' : 'var(--accent-earth-blue)'} />
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: timeLeft <= 5 ? '#991B1B' : 'var(--text-main)' }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '32px', padding: '32px 24px' }}>
        {question.imageUrl && (
          <div style={{ marginBottom: '20px', overflow: 'hidden', borderRadius: '14px', maxHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px' }}>
            <img
              src={question.imageUrl}
              alt="Question Illustration"
              style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '10px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.4, color: 'var(--text-main)' }}>
          {question.questionText}
        </h1>
      </div>

      {/* Options Chart */}
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
                borderRadius: '16px',
                padding: '22px 20px',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                border: result && isCorrect ? '3px solid #FDF6E3' : '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(15,23,42,0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{styleObj.symbol}</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{opt.text}</span>
                </div>
                {result && (
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, background: 'rgba(0,0,0,0.25)', padding: '4px 14px', borderRadius: '20px' }}>
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
            borderRadius: '12px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: 'var(--text-main)',
            fontSize: '1.05rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Trophy size={18} color="var(--accent-earth-orange)" /> ดู Leaderboard
        </button>

        <button
          type="button"
          onClick={onNextQuestion}
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: 'var(--accent-earth-blue)',
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
          }}
        >
          ข้อถัดไป <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

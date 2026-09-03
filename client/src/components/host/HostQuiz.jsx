import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Users, Clock, ArrowRight, Trophy, BarChart3, Check } from 'lucide-react';

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

  const maxCount = Math.max(...question.options.map(opt => result?.optionCounts?.[opt.id] || 0), 1);

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

      {/* Options Presentation: Vertical Bar Chart when result is present */}
      {result ? (
        <div className="glass-card animate-pop" style={{ padding: '30px 24px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={24} color="var(--accent-earth-blue)" /> สรุปผลคำตอบของผู้เข้าร่วมอบรม
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}>
              ส่งคำตอบแล้ว {result.answeredCount || answeredCount} จากทั้งหมด {totalPlayers} คน
            </div>
          </div>

          {/* Vertical Bar Chart Container */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${question.options.length}, 1fr)`,
              gap: '16px',
              alignItems: 'flex-end',
              height: '270px',
              padding: '24px 12px 0 12px',
              borderBottom: '3px solid #CBD5E1',
              marginBottom: '18px'
            }}
          >
            {question.options.map((opt, idx) => {
              const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
              const isCorrect = result.correctOptionId === opt.id;
              const count = result.optionCounts?.[opt.id] || 0;
              const barHeight = Math.max(22, Math.round((count / maxCount) * 200));

              return (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  {/* Answer Count Label */}
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: isCorrect ? '#166534' : 'var(--text-main)',
                    marginBottom: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isCorrect && (
                      <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={13} strokeWidth={3} /> ถูกต้อง
                      </span>
                    )}
                    <span>{count} คน</span>
                  </div>

                  {/* Vertical Bar */}
                  <div
                    className="animate-pop"
                    style={{
                      width: '100%',
                      maxWidth: '120px',
                      height: `${barHeight}px`,
                      background: styleObj.bg,
                      borderRadius: '16px 16px 0 0',
                      border: isCorrect ? '3px solid #22C55E' : '1px solid rgba(0,0,0,0.1)',
                      boxShadow: isCorrect ? '0 0 18px rgba(34, 197, 94, 0.45)' : '0 4px 10px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <span style={{ fontSize: '2.2rem', color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {styleObj.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Option Label Row below chart */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${question.options.length}, 1fr)`, gap: '16px' }}>
            {question.options.map((opt, idx) => {
              const isCorrect = result.correctOptionId === opt.id;
              const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
              return (
                <div
                  key={opt.id}
                  style={{
                    textAlign: 'center',
                    padding: '12px 10px',
                    borderRadius: '14px',
                    background: isCorrect ? '#F0FDF4' : '#F8FAFC',
                    border: isCorrect ? '2px solid #86EFAC' : '1px solid #E2E8F0',
                    boxShadow: isCorrect ? '0 2px 8px rgba(34, 197, 94, 0.15)' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: isCorrect ? '#166534' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>{styleObj.symbol}</span> ข้อ {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: isCorrect ? '#166534' : 'var(--text-muted)', marginTop: '4px', wordBreak: 'break-word', fontWeight: 600 }}>
                    {opt.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Regular Choice Grid while question is active */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {question.options.map((opt, idx) => {
            const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
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
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{styleObj.symbol}</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{opt.text}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

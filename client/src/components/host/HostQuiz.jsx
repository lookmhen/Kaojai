import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Users, Clock, ArrowRight, Trophy, BarChart3, Check, ListOrdered, Sparkles, CheckCircle2 } from 'lucide-react';

const OPTION_STYLES = [
  { bg: 'var(--choice-red-gradient)', color: '#991B1B', symbol: '▲' },
  { bg: 'var(--choice-blue-gradient)', color: '#1E40AF', symbol: '◆' },
  { bg: 'var(--choice-yellow-gradient)', color: '#B45309', symbol: '●' },
  { bg: 'var(--choice-green-gradient)', color: '#166534', symbol: '■' }
];

export const HostQuiz = ({ question, result, answeredCount, totalPlayers, onNextQuestion, onShowLeaderboard }) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSeconds);
  const isSequence = question?.questionType === 'SEQUENCE' || Boolean(question?.sequenceItems?.length);

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

  const maxCount = Math.max(...(question.options?.map(opt => result?.optionCounts?.[opt.id] || 0) || [1]), 1);

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

      {/* Options / Sequence Presentation */}
      {isSequence ? (
        result ? (
          /* Sequence Race Result Phase: Step-by-Step Flowchart Cards */
          <div className="glass-card animate-pop" style={{ padding: '32px 28px', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 58, 138, 0.1)', color: 'var(--accent-earth-blue)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '10px' }}>
                <ListOrdered size={18} /> เฉลยลำดับขั้นตอนที่ถูกต้อง (Sequence Race Results)
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                กระบวนการและลำดับขั้นตอนมาตรฐาน
              </h2>

              {/* Perfect vs Partial Stats Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
                <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', borderRadius: '16px', padding: '6px 16px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#166534" /> เรียงถูกต้องครบ 100%: <strong>{result.perfectCount || 0} คน</strong>
                </span>
                <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: '16px', padding: '6px 16px', fontSize: '0.9rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#D97706" /> เรียงถูกบางส่วน: <strong>{result.partialCount || 0} คน</strong>
                </span>
              </div>
            </div>

            {/* Step-by-Step Flowchart Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '820px', margin: '0 auto' }}>
              {(result.correctSequence || question.sequenceItems || []).map((step, sIdx) => (
                <div
                  key={step.id || sIdx}
                  className="animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: '#FFFFFF',
                    border: '2px solid #10B981',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {sIdx + 1}
                  </div>

                  <div style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>
                    {step.text}
                  </div>

                  <div style={{ flexShrink: 0, background: '#DCFCE7', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={20} color="#166534" strokeWidth={3} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Sequence Race Active Phase */
          <div className="glass-card animate-pop" style={{ padding: '40px 24px', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(217, 119, 6, 0.1)', color: '#B45309', padding: '8px 20px', borderRadius: '30px', fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>
              <ListOrdered size={20} /> โหมด Sequence Race (เกมเรียงลำดับขั้นตอน)
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              ผู้เรียนกำลังจัดเรียงลำดับขั้นตอนบนหน้าจอมือถือ...
            </h3>

            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 28px auto', lineHeight: 1.5 }}>
              สังเกตและพิจารณาขั้นตอนทั้งหมดอย่างรอบคอบ ยิ่งเรียงถูกต้องครบทุกขั้นตอนและส่งคำตอบเร็ว ยิ่งได้คะแนนสูง!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', maxWidth: '820px', margin: '0 auto' }}>
              {(question.sequenceItems || []).map((step, idx) => (
                <div
                  key={step.id || idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '14px',
                    padding: '16px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E2E8F0', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>
                    ?
                  </span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : result ? (
        /* Regular Choice Results: Vertical Bar Chart */
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
              gridTemplateColumns: `repeat(${question.options?.length || 4}, 1fr)`,
              gap: '16px',
              alignItems: 'flex-end',
              height: '270px',
              padding: '24px 12px 0 12px',
              borderBottom: '3px solid #CBD5E1',
              marginBottom: '18px'
            }}
          >
            {question.options?.map((opt, idx) => {
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
                      color: '#FFFFFF'
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{styleObj.symbol}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Option Answer Details Cards below the bar chart */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${question.options?.length || 4}, 1fr)`, gap: '12px' }}>
            {question.options?.map((opt, idx) => {
              const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
              const isCorrect = result.correctOptionId === opt.id;

              return (
                <div
                  key={opt.id}
                  style={{
                    background: isCorrect ? '#F0FDF4' : '#F8FAFC',
                    border: isCorrect ? '2px solid #22C55E' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    boxShadow: isCorrect ? '0 2px 10px rgba(34, 197, 94, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.85rem', color: isCorrect ? '#166534' : styleObj.color, marginBottom: '4px' }}>
                    <span>{styleObj.symbol}</span>
                    <span>ข้อ {idx + 1}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
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
          {question.options?.map((opt, idx) => {
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

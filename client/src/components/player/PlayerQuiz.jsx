import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { CheckCircle2, XCircle, Users, Clock, BarChart3, Flame, Zap } from 'lucide-react';
import { SoundToggle } from '../common/SoundToggle';
import { PlayerSequence } from './PlayerSequence';

const OPTION_STYLES = [
  { bg: 'var(--choice-red-gradient)', symbol: '▲' },
  { bg: 'var(--choice-blue-gradient)', symbol: '◆' },
  { bg: 'var(--choice-yellow-gradient)', symbol: '●' },
  { bg: 'var(--choice-green-gradient)', symbol: '■' }
];

export const PlayerQuiz = ({ question, result, pin, player, answeredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question?.timeLimitSeconds ?? 30);

  const handleSubmitSequence = (orderedItemIds) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (socket) {
      socket.emit('submit_answer', {
        pin,
        playerId: player.playerId,
        orderedItemIds
      });
    }
  };

  useEffect(() => {
    if (!question) return;
    setSelectedOptionId(null);
    setFeedback(null);
    setIsSubmitting(false);
    setTimeLeft(question.timeLimitSeconds ?? 30);

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

  useEffect(() => {
    if (result) {
      setTimeLeft(0);
    }
  }, [result]);

  const isFinalQuestion = Boolean(result?.isLastQuestion || (question?.questionIndex + 1 >= question?.totalQuestions));

  useEffect(() => {
    if (!socket) return;

    const handleFeedback = (data) => {
      setFeedback(data);
      if (data.isCorrect) {
        if (data.streak >= 2) {
          sfx.playStreak(data.streak);
        } else if (data.isComeback) {
          sfx.playComeback();
        } else {
          sfx.playCorrect();
        }
      } else {
        sfx.playWrong();
      }
    };

    socket.on('answer_feedback', handleFeedback);

    return () => {
      socket.off('answer_feedback', handleFeedback);
    };
  }, [socket]);

  const handleChooseOption = (optionId) => {
    if (selectedOptionId || isSubmitting) return;

    setSelectedOptionId(optionId);
    setIsSubmitting(true);

    socket.emit('submit_answer', {
      pin,
      playerId: player.playerId,
      optionId
    });
  };

  if (!question) {
    return (
      <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
        <div className="glass-card animate-pop" style={{ padding: '36px 20px' }}>
          <Clock size={40} color="var(--accent-earth-blue)" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            กำลังรอคำถามถัดไปจากวิทยากร...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            เตรียมตัวให้พร้อมบนหน้าจอนี้ โจทย์จะแสดงให้อัตโนมัติเมื่อเริ่มข้อใหม่ ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '20px auto', padding: '0 16px' }}>
      {/* Top Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          ข้อที่ {question.questionIndex + 1} / {question.totalQuestions}
        </div>

        {/* Visible Countdown Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: timeLeft <= 5 ? '#FEF2F2' : '#FFFFFF',
            border: timeLeft <= 5 ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
            padding: '6px 14px',
            borderRadius: '20px'
          }}
        >
          <Clock size={16} color={timeLeft <= 5 ? '#991B1B' : 'var(--accent-earth-blue)'} />
          <span style={{ fontWeight: 800, color: timeLeft <= 5 ? '#991B1B' : 'var(--text-main)', fontSize: '1.05rem' }}>
            {timeLeft}s
          </span>
        </div>

        {/* Counter Badge & Sound Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="counter-badge" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
            <Users size={14} color="var(--accent-earth-orange)" />
            <span><span className="highlight" style={{ fontSize: '1.1rem' }}>{answeredCount}</span>/{totalPlayers}</span>
          </div>
          <SoundToggle size={15} style={{ width: '32px', height: '32px' }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        {question.imageUrl && (
          <div style={{ marginBottom: '14px', overflow: 'hidden', borderRadius: '12px', maxHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px' }}>
            <img
              src={question.imageUrl}
              alt="Question Illustration"
              style={{ maxWidth: '100%', maxHeight: '168px', objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-main)' }}>
          {question.questionText}
        </h2>
      </div>

      {question.questionType === 'SEQUENCE' ? (
        <PlayerSequence
          question={question}
          onSubmitOrder={handleSubmitSequence}
          isSubmitting={isSubmitting}
          feedback={feedback}
          result={result}
        />
      ) : (feedback || result) ? (
        <div
          className="glass-card animate-pop"
          style={{
            textAlign: 'center',
            padding: '28px 20px',
            background: feedback ? (feedback.isCorrect ? '#F0FDF4' : '#FEF2F2') : '#F8FAFC',
            border: feedback ? (feedback.isCorrect ? '2px solid #166534' : '2px solid #991B1B') : '2px solid #CBD5E1'
          }}
        >
          {feedback ? (
            feedback.isCorrect ? (
              <>
                <CheckCircle2 size={50} color="#166534" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#166534' }}>ถูกต้องที่สุด! 🎉</h3>
                <p style={{ fontSize: '1.25rem', marginTop: '6px', fontWeight: 800, color: '#15803D' }}>
                  +{feedback.pointsEarned} คะแนน!
                </p>

                {/* Streak Badge */}
                {feedback.streak >= 2 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '10px',
                      padding: '6px 16px',
                      borderRadius: '50px',
                      background: feedback.streak >= 4
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                        : feedback.streak === 3
                        ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                        : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  >
                    <Flame size={18} />
                    <span>
                      {feedback.streak >= 4
                        ? `STREAK x${feedback.streak} UNSTOPPABLE! (+${feedback.streakBonus})`
                        : feedback.streak === 3
                        ? `STREAK x3 ON FIRE! (+${feedback.streakBonus})`
                        : `STREAK x2 (+${feedback.streakBonus})`}
                    </span>
                  </div>
                )}

                {/* Comeback Boost Badge */}
                {feedback.isComeback && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      marginLeft: feedback.streak >= 2 ? '6px' : '0',
                      padding: '6px 14px',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
                    }}
                  >
                    <Zap size={16} />
                    <span>Comeback Boost! +40 (กำลังใจคนสู้กลับ!)</span>
                  </div>
                )}

                {/* Points Breakdown */}
                {(feedback.streakBonus > 0 || feedback.comebackBonus > 0) && (
                  <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '8px', opacity: 0.9 }}>
                    ฐานความเร็ว {feedback.basePoints || (feedback.pointsEarned - (feedback.streakBonus || 0) - (feedback.comebackBonus || 0))}
                    {feedback.streakBonus > 0 && ` + โบนัสคอมโบ ${feedback.streakBonus}`}
                    {feedback.comebackBonus > 0 && ` + สู้กลับ ${feedback.comebackBonus}`}
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle size={50} color="#991B1B" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#991B1B' }}>ยังไม่ถูกต้อง 😅</h3>
                <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                  ไม่ต้องเสียใจ สะสมความเข้าใจในข้อถัดไปกันนะ!
                </p>
              </>
            )
          ) : (
            <>
              <Clock size={50} color="#D97706" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#B45309' }}>หมดเวลาตอบคำถาม ⏳</h3>
              <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                ไม่ได้ส่งคำตอบทันในรอบนี้ ลุยต่อในข้อถัดไปนะ!
              </p>
            </>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            {result
              ? (isFinalQuestion
                  ? '🏁 คำถามข้อสุดท้ายเสร็จสิ้นแล้ว! เตรียมดูสรุปผลคะแนนและผู้ชนะบนหน้าจอใหญ่...'
                  : 'สรุปผลคำตอบของเพื่อนๆ ทุกคนในข้อนี้:')
              : 'รอการสรุปผลคำตอบจากวิทยากร...'}
          </p>

          {result && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${question.options?.length || 4}, 1fr)`,
                  gap: '8px',
                  alignItems: 'flex-end',
                  height: '160px',
                  padding: '10px 4px 0 4px',
                  borderBottom: '2px solid #CBD5E1',
                  marginBottom: '10px'
                }}
              >
                {question.options?.map((opt, idx) => {
                  const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
                  const isCorrect = result.correctOptionId === opt.id;
                  const count = result.optionCounts?.[opt.id] || 0;
                  const barHeight = Math.max(16, Math.round((count / Math.max(...(question.options?.map(o => result?.optionCounts?.[o.id] || 0) || [1]), 1)) * 115));

                  return (
                    <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isCorrect ? '#166534' : 'var(--text-main)', marginBottom: '4px' }}>
                        {isCorrect && <span style={{ color: '#166534', fontSize: '0.75rem', display: 'block', fontWeight: 900 }}>✓</span>}
                        {count}
                      </div>
                      <div
                        className="animate-pop"
                        style={{
                          width: '100%',
                          maxWidth: '55px',
                          height: `${barHeight}px`,
                          background: styleObj.bg,
                          borderRadius: '8px 8px 0 0',
                          border: isCorrect ? '2px solid #22C55E' : 'none',
                          boxShadow: isCorrect ? '0 0 10px rgba(34,197,94,0.4)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>{styleObj.symbol}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${question.options?.length || 4}, 1fr)`, gap: '6px' }}>
                {question.options?.map((opt, idx) => {
                  const isCorrect = result.correctOptionId === opt.id;
                  const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
                  return (
                    <div key={opt.id} style={{ fontSize: '0.75rem', fontWeight: 700, color: isCorrect ? '#166534' : 'var(--text-muted)' }}>
                      {styleObj.symbol} ข้อ {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {question.options?.map((opt, idx) => {
            const styleObj = OPTION_STYLES[idx % OPTION_STYLES.length];
            const isChosen = selectedOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChooseOption(opt.id)}
                disabled={selectedOptionId !== null}
                style={{
                  background: styleObj.bg,
                  borderRadius: '14px',
                  padding: '18px 14px',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  opacity: selectedOptionId && !isChosen ? 0.4 : 1,
                  transform: isChosen ? 'scale(1.03)' : 'scale(1)',
                  minHeight: '105px'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{styleObj.symbol}</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

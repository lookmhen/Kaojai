import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { CheckCircle2, XCircle, Users } from 'lucide-react';

const OPTION_STYLES = [
  { bg: 'var(--choice-red-gradient)', symbol: '▲' },
  { bg: 'var(--choice-blue-gradient)', symbol: '◆' },
  { bg: 'var(--choice-yellow-gradient)', symbol: '●' },
  { bg: 'var(--choice-green-gradient)', symbol: '■' }
];

export const PlayerQuiz = ({ question, pin, player, answeredCount, totalPlayers }) => {
  const { socket } = useSocket();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset state on new question
    setSelectedOptionId(null);
    setFeedback(null);
    setIsSubmitting(false);
  }, [question?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleFeedback = (data) => {
      setFeedback(data);
      if (data.isCorrect) {
        sfx.playCorrect();
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

  return (
    <div style={{ maxWidth: '480px', margin: '20px auto', padding: '0 16px' }}>
      {/* Answered / Total Count Counter Badge (CRITICAL USER FEATURE) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          ข้อที่ {question.questionIndex + 1} / {question.totalQuestions}
        </div>
        <div className="counter-badge">
          <Users size={16} color="var(--accent-yellow)" />
          <span>ตอบแล้ว <span className="highlight">{answeredCount}</span> / {totalPlayers}</span>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.4 }}>
          {question.questionText}
        </h2>
      </div>

      {feedback ? (
        <div
          className="glass-card animate-pop"
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: feedback.isCorrect ? 'rgba(39, 174, 96, 0.25)' : 'rgba(231, 76, 60, 0.25)',
            border: feedback.isCorrect ? '2px solid var(--pulse-green)' : '2px solid var(--pulse-red)'
          }}
        >
          {feedback.isCorrect ? (
            <>
              <CheckCircle2 size={54} color="var(--pulse-green)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--pulse-green)' }}>ถูกต้องที่สุด! 🎉</h3>
              <p style={{ fontSize: '1.2rem', marginTop: '8px', fontWeight: 600 }}>
                +{feedback.pointsEarned} คะแนน!
              </p>
            </>
          ) : (
            <>
              <XCircle size={54} color="var(--pulse-red)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--pulse-red)' }}>ยังไม่ถูกต้อง 😅</h3>
              <p style={{ fontSize: '1rem', marginTop: '8px', color: 'rgba(255,255,255,0.8)' }}>
                ไม่ต้องเสียใจ สะสมความเข้าใจในข้อถัดไปกันนะ!
              </p>
            </>
          )}
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: '20px' }}>
            รอการสรุปผลคำตอบจากวิทยากร...
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {question.options.map((opt, idx) => {
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
                  borderRadius: '16px',
                  padding: '24px 16px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isChosen ? '0 0 20px rgba(255,255,255,0.8)' : '0 6px 18px rgba(0,0,0,0.3)',
                  opacity: selectedOptionId && !isChosen ? 0.4 : 1,
                  transform: isChosen ? 'scale(1.05)' : 'scale(1)',
                  minHeight: '120px'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{styleObj.symbol}</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sfx } from '../../utils/audioSFX';
import { CheckCircle2, XCircle, Users, Clock } from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSeconds);

  useEffect(() => {
    // Reset state on new question
    setSelectedOptionId(null);
    setFeedback(null);
    setIsSubmitting(false);
    setTimeLeft(question.timeLimitSeconds);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        // Play accelerating tense tick sound when time <= 5 seconds!
        if (prev <= 6) {
          sfx.playTenseTick(prev - 1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
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
      {/* Top Status Bar: Question Progress, Countdown Timer & Answered Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          ข้อที่ {question.questionIndex + 1} / {question.totalQuestions}
        </div>

        {/* Visible Countdown Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: timeLeft <= 5 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(0,0,0,0.3)',
            border: timeLeft <= 5 ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.2)',
            padding: '6px 14px',
            borderRadius: '20px'
          }}
        >
          <Clock size={16} color={timeLeft <= 5 ? '#e74c3c' : 'var(--accent-cyan)'} />
          <span style={{ fontWeight: 800, color: timeLeft <= 5 ? '#ff7675' : '#fff', fontSize: '1.1rem' }}>
            {timeLeft}s
          </span>
        </div>

        {/* Answered / Total Count Counter Badge */}
        <div className="counter-badge" style={{ padding: '6px 12px', fontSize: '0.95rem' }}>
          <Users size={14} color="var(--accent-yellow)" />
          <span><span className="highlight" style={{ fontSize: '1.1rem' }}>{answeredCount}</span>/{totalPlayers}</span>
        </div>
      </div>

      {/* Question Card (with Image Support) */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        {question.imageUrl && (
          <div style={{ marginBottom: '12px', overflow: 'hidden', borderRadius: '12px', maxHeight: '180px' }}>
            <img
              src={question.imageUrl}
              alt="Question Illustration"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4 }}>
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
                  padding: '20px 14px',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isChosen ? '0 0 20px rgba(255,255,255,0.8)' : '0 6px 18px rgba(0,0,0,0.3)',
                  opacity: selectedOptionId && !isChosen ? 0.4 : 1,
                  transform: isChosen ? 'scale(1.05)' : 'scale(1)',
                  minHeight: '110px'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{styleObj.symbol}</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

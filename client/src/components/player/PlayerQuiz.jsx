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

        {/* Counter Badge */}
        <div className="counter-badge" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
          <Users size={14} color="var(--accent-earth-orange)" />
          <span><span className="highlight" style={{ fontSize: '1.1rem' }}>{answeredCount}</span>/{totalPlayers}</span>
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

      {feedback ? (
        <div
          className="glass-card animate-pop"
          style={{
            textAlign: 'center',
            padding: '28px 20px',
            background: feedback.isCorrect ? '#F0FDF4' : '#FEF2F2',
            border: feedback.isCorrect ? '2px solid #166534' : '2px solid #991B1B'
          }}
        >
          {feedback.isCorrect ? (
            <>
              <CheckCircle2 size={50} color="#166534" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#166534' }}>ถูกต้องที่สุด! 🎉</h3>
              <p style={{ fontSize: '1.15rem', marginTop: '6px', fontWeight: 700, color: '#15803D' }}>
                +{feedback.pointsEarned} คะแนน!
              </p>
            </>
          ) : (
            <>
              <XCircle size={50} color="#991B1B" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#991B1B' }}>ยังไม่ถูกต้อง 😅</h3>
              <p style={{ fontSize: '0.95rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                ไม่ต้องเสียใจ สะสมความเข้าใจในข้อถัดไปกันนะ!
              </p>
            </>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '16px' }}>
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

import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Sparkles, Zap } from 'lucide-react';

export const PrepareCountdown = ({ nextQuestionIndex = 0, totalQuestions = 0, initialSeconds = 5, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    // Play initial beep
    sfx.playCountdownBeep(initialSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextSec = prev - 1;
        if (nextSec > 0) {
          sfx.playCountdownBeep(nextSec);
          return nextSec;
        } else {
          clearInterval(interval);
          if (typeof onComplete === 'function') {
            onComplete();
          }
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds, onComplete]);

  // Color dynamic based on remaining seconds
  const numberColor =
    secondsLeft >= 4
      ? 'var(--accent-earth-blue, #1E3A8A)'
      : secondsLeft >= 2
      ? 'var(--accent-earth-orange, #D97706)'
      : 'var(--accent-earth-green, #138808)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div
        className="glass-card animate-pop"
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: '40px 32px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          border: '3px solid #E2E8F0'
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#92400E',
            padding: '8px 20px',
            borderRadius: '30px',
            fontWeight: 800,
            fontSize: '0.95rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}
        >
          <Zap size={18} color="#D97706" /> เตรียมตัวให้พร้อม! (Get Ready!)
        </div>

        {/* Question Counter Subtext */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '28px'
          }}
        >
          คำถามข้อที่ {nextQuestionIndex + 1} จากทั้งหมด {totalQuestions} ข้อ
        </h3>

        {/* Big Animated Countdown Circle */}
        <div
          key={secondsLeft}
          className="animate-pop"
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: '#F8FAFC',
            border: `6px solid ${numberColor}`,
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 25px rgba(0,0,0,0.08)`
          }}
        >
          <span
            style={{
              fontSize: '5.5rem',
              fontWeight: 900,
              color: numberColor,
              lineHeight: 1,
              userSelect: 'none'
            }}
          >
            {secondsLeft > 0 ? secondsLeft : '🔥'}
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>
          {secondsLeft === 1 ? 'เริ่มเลยตอนนี้! 🚀' : 'อ่านโจทย์และเลือกคำตอบให้ไวที่สุด! ⏱️'}
        </p>
      </div>
    </div>
  );
};

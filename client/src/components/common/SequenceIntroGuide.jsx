import React from 'react';
import { Sparkles, ArrowDownUp, CheckCircle, Play, Info, Flame } from 'lucide-react';

export const SequenceIntroGuide = ({
  isHost = false,
  nextQuestionIndex = 0,
  totalQuestions = 0,
  questionText = '',
  onStartQuestion
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100,
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="glass-card animate-pop"
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: isHost ? '36px 40px' : '28px 20px',
          maxWidth: isHost ? '680px' : '440px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '3px solid #CBD5E1',
          position: 'relative'
        }}
      >
        {/* Top Highlight Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1.5px solid #F59E0B',
            color: '#92400E',
            padding: '8px 22px',
            borderRadius: '30px',
            fontWeight: 900,
            fontSize: '0.92rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
          }}
        >
          <Flame size={18} color="#D97706" /> ข้อนี้พบกับโหมดใหม่! (First Look)
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: isHost ? '2.1rem' : '1.55rem',
            fontWeight: 900,
            color: 'var(--text-main, #0F172A)',
            margin: '0 0 6px 0',
            lineHeight: 1.2
          }}
        >
          🏎️ แข่งจัดเรียงลำดับขั้นตอน (Sequence Race)
        </h2>

        {/* Question Counter */}
        <p
          style={{
            color: 'var(--text-muted, #64748B)',
            fontSize: '0.95rem',
            fontWeight: 700,
            marginBottom: '20px'
          }}
        >
          คำถามข้อที่ {nextQuestionIndex + 1} จาก {totalQuestions} ข้อ
        </p>

        {/* ====================================================
            CSS DEMO ANIMATION: Animated Cards & Hand Drag Gesture
            ==================================================== */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '20px',
            padding: '20px 16px',
            border: '1.5px solid #E2E8F0',
            marginBottom: '22px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--accent-earth-blue, #1E3A8A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '14px'
            }}
          >
            <ArrowDownUp size={16} /> วิธีการเล่น: สลับตำแหน่งการ์ดให้ถูกต้อง
          </div>

          {/* Cards Stage Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              height: '160px',
              margin: '0 auto'
            }}
          >
            {/* Card 1 (Slides down to swap) */}
            <div
              className="seq-demo-card-1"
              style={{
                position: 'absolute',
                top: '0px',
                left: 0,
                right: 0,
                height: '46px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '2px solid #3B82F6',
                borderLeft: '6px solid #2563EB',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '10px',
                boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                zIndex: 2
              }}
            >
              <div style={{ background: '#2563EB', color: '#FFF', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900 }}>
                #1
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', flex: 1, textAlign: 'left' }}>
                ขั้นที่ 1: วิเคราะห์โจทย์และปัญหา
              </div>
            </div>

            {/* Card 2 (Slides up to swap) */}
            <div
              className="seq-demo-card-2"
              style={{
                position: 'absolute',
                top: '56px',
                left: 0,
                right: 0,
                height: '46px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '2px solid #F59E0B',
                borderLeft: '6px solid #D97706',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '10px',
                boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                zIndex: 1
              }}
            >
              <div style={{ background: '#D97706', color: '#FFF', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900 }}>
                #2
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', flex: 1, textAlign: 'left' }}>
                ขั้นที่ 2: วางแผนกระบวนการแก้ไข
              </div>
            </div>

            {/* Card 3 (Static base) */}
            <div
              style={{
                position: 'absolute',
                top: '112px',
                left: 0,
                right: 0,
                height: '46px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '2px solid #10B981',
                borderLeft: '6px solid #059669',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '10px',
                boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                zIndex: 1
              }}
            >
              <div style={{ background: '#059669', color: '#FFF', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900 }}>
                #3
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', flex: 1, textAlign: 'left' }}>
                ขั้นที่ 3: ลงมือปฏิบัติและตรวจสอบผล
              </div>
            </div>

            {/* Hand Gesture Icon */}
            <div
              className="seq-demo-hand"
              style={{
                position: 'absolute',
                top: '8px',
                left: '70%',
                zIndex: 10,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                fontSize: '2.2rem'
              }}
            >
              👆
            </div>
          </div>
        </div>

        {/* 2-Step Key Instructions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isHost ? '1fr 1fr' : '1fr',
            gap: '12px',
            marginBottom: '26px'
          }}
        >
          <div
            style={{
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            <div style={{ background: '#3B82F6', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              1
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.92rem' }}>แตะค้างแล้วลากสลับที่</div>
              <div style={{ fontSize: '0.78rem', color: '#3B82F6' }}>หรือกดปุ่มลูกศร ⬆️ ⬇️ เพื่อเลื่อน</div>
            </div>
          </div>

          <div
            style={{
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            <div style={{ background: '#10B981', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              2
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.92rem' }}>กดยืนยันคำตอบ 🚀</div>
              <div style={{ fontSize: '0.78rem', color: '#059669' }}>เมื่อเรียงครบแล้ว อย่าลืมกดยืนยัน!</div>
            </div>
          </div>
        </div>

        {/* Action Area: Host vs Player */}
        {isHost ? (
          <div>
            <button
              type="button"
              onClick={() => onStartQuestion?.()}
              style={{
                width: '100%',
                padding: '18px 28px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
                borderBottom: '4px solid #14532D',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={24} fill="#FFFFFF" /> ผู้เรียนพร้อมแล้ว เริ่มทำข้อสอบเลย!
            </button>
            <p
              style={{
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginTop: '12px',
                marginBottom: 0
              }}
            >
              💡 ผู้สอนอธิบายกติกาในห้องได้ตามต้องการ เมื่อผู้เรียนเข้าใจแล้วให้กดปุ่มเพื่อเริ่มข้อสอบ
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '16px',
              border: '1.5px solid #E2E8F0'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent-earth-blue, #1E3A8A)',
                fontWeight: 800,
                fontSize: '0.95rem'
              }}
            >
              <span className="pulse-dot" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />
              ฟังคำอธิบายจากวิทยากรในห้อง...
            </div>
            <p
              style={{
                color: 'var(--text-muted, #64748B)',
                fontSize: '0.82rem',
                marginTop: '6px',
                marginBottom: 0
              }}
            >
              วิทยากรจะเป็นผู้กดเริ่มข้อสอบพร้อมกันทั้งห้อง เตรียมนิ้วให้พร้อม! ✨
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

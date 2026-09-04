import React, { useState, useEffect } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Check, Send, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { sfx } from '../../utils/audioSFX';

export const PlayerSequence = ({
  question,
  onSubmitOrder,
  isSubmitting,
  feedback,
  result
}) => {
  const [items, setItems] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    if (question?.sequenceItems) {
      setItems([...question.sequenceItems]);
    }
    setIsSubmitted(false);
  }, [question?.id]);

  const handleMove = (index, direction) => {
    if (isSubmitted || isSubmitting) return;

    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    sfx.playCuteChime();
    const updated = [...items];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, movedItem);
    setItems(updated);
  };

  const handleDragStart = (e, index) => {
    if (isSubmitted || isSubmitting) return;
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updated = [...items];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setItems(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSubmit = () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitted(true);
    onSubmitOrder(items.map(item => item.id));
  };

  const correctIds = result?.correctSequence?.map(s => s.id) || [];

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Sub-instruction badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(217, 119, 6, 0.1)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '20px',
          padding: '6px 14px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#B45309'
        }}
      >
        <Sparkles size={16} /> ลากหรือกดลูกศร ⬆️ ⬇️ เพื่อจัดเรียงลำดับขั้นตอนให้ถูกต้อง
      </div>

      {/* Sequence Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, idx) => {
          const isCorrectPosition = result && correctIds[idx] === item.id;
          const isWrongPosition = result && correctIds[idx] !== item.id;

          return (
            <div
              key={item.id}
              draggable={!isSubmitted}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isCorrectPosition
                  ? '#ECFDF5'
                  : isWrongPosition
                  ? '#FEF2F2'
                  : '#FFFFFF',
                border: isCorrectPosition
                  ? '2px solid #10B981'
                  : isWrongPosition
                  ? '2px solid #EF4444'
                  : '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px 14px',
                boxShadow: draggedIdx === idx
                  ? '0 12px 24px rgba(30, 58, 138, 0.18)'
                  : '0 2px 8px rgba(15, 23, 42, 0.04)',
                transform: draggedIdx === idx ? 'scale(1.02)' : 'none',
                opacity: draggedIdx === idx ? 0.8 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {/* Step Number Badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isCorrectPosition
                    ? '#10B981'
                    : isWrongPosition
                    ? '#EF4444'
                    : 'var(--accent-earth-blue)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {idx + 1}
              </div>

              {/* Step Text Content */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  lineHeight: 1.4
                }}
              >
                {item.text}
              </div>

              {/* Status indicator after result */}
              {result && (
                <div style={{ flexShrink: 0 }}>
                  {isCorrectPosition ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <XCircle size={20} color="#EF4444" />
                  )}
                </div>
              )}

              {/* Reordering Controls (Up / Down Arrows + Drag Grip) */}
              {!isSubmitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    style={{
                      background: idx === 0 ? '#F1F5F9' : '#E2E8F0',
                      color: idx === 0 ? '#94A3B8' : 'var(--text-main)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer'
                    }}
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp size={16} />
                  </button>

                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    style={{
                      background: idx === items.length - 1 ? '#F1F5F9' : '#E2E8F0',
                      color: idx === items.length - 1 ? '#94A3B8' : 'var(--text-main)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                    title="เลื่อนลง"
                  >
                    <ArrowDown size={16} />
                  </button>

                  <div
                    style={{
                      color: '#94A3B8',
                      cursor: 'grab',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="ลากสลับตำแหน่ง"
                  >
                    <GripVertical size={18} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button / Waiting Banner */}
      <div style={{ marginTop: '20px' }}>
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #138808 0%, #0F6E06 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(19, 136, 8, 0.35)',
              borderBottom: '3px solid #0B5605',
              cursor: 'pointer'
            }}
          >
            <Send size={18} /> ยืนยันลำดับคำตอบ (Submit Sequence)
          </button>
        ) : (
          <div
            className="glass-card animate-pop"
            style={{
              padding: '16px 20px',
              background: '#F0FDF4',
              border: '2px solid #86EFAC',
              borderRadius: '16px',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Check size={20} color="#166534" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              บันทึกการส่งลำดับคำตอบแล้ว! รอวิทยากรเฉลยสรุปผล...
            </span>
          </div>
        )}
      </div>

      {/* Correct Sequence Breakdown when result arrived */}
      {result && result.correctSequence && (
        <div className="glass-card animate-pop" style={{ marginTop: '20px', padding: '18px 16px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-earth-orange)" /> เฉลยลำดับขั้นตอนที่ถูกต้อง:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.correctSequence.map((step, sIdx) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: '#F8FAFC',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <span
                  style={{
                    background: '#138808',
                    color: '#FFFFFF',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  {sIdx + 1}
                </span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

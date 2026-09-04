import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Check, Send, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { sfx } from '../../utils/audioSFX';
import { getSequenceTheme } from '../../utils/sequenceThemes';

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
  const listRef = useRef(null);
  const draggedIdxRef = useRef(null);

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

  const handlePointerDown = (e, index) => {
    if (isSubmitted || isSubmitting) return;
    if (e.button !== undefined && e.button !== 0) return;

    // Prevent default touch gestures (page scroll) while dragging
    e.preventDefault();

    draggedIdxRef.current = index;
    setDraggedIdx(index);

    const onPointerMove = (moveEvent) => {
      if (draggedIdxRef.current === null) return;
      const currentIdx = draggedIdxRef.current;

      if (!listRef.current) return;
      const nodes = listRef.current.querySelectorAll('[data-seq-index]');
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const targetIdx = parseInt(node.dataset.seqIndex, 10);
        if (moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom) {
          if (!isNaN(targetIdx) && targetIdx !== currentIdx) {
            setItems(prevItems => {
              const updated = [...prevItems];
              const [moved] = updated.splice(currentIdx, 1);
              updated.splice(targetIdx, 0, moved);
              return updated;
            });
            draggedIdxRef.current = targetIdx;
            setDraggedIdx(targetIdx);
            sfx.playCuteChime();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(25);
            }
            break;
          }
        }
      }
    };

    const onPointerUp = () => {
      draggedIdxRef.current = null;
      setDraggedIdx(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, idx) => {
          const isCorrectPosition = result && correctIds[idx] === item.id;
          const isWrongPosition = result && correctIds[idx] !== item.id;
          const isCurrentDragged = draggedIdx === idx;
          const theme = getSequenceTheme(item, question?.sequenceItems || items);

          return (
            <div
              key={item.id}
              data-seq-index={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: isCorrectPosition
                  ? '#ECFDF5'
                  : isWrongPosition
                  ? '#FEF2F2'
                  : isCurrentDragged
                  ? '#FFFFFF'
                  : theme.cardBg,
                border: isCorrectPosition
                  ? '2px solid #10B981'
                  : isWrongPosition
                  ? '2px solid #EF4444'
                  : isCurrentDragged
                  ? `2.5px solid ${theme.accentBar}`
                  : `1.5px solid ${theme.borderColor}`,
                borderLeft: isCorrectPosition
                  ? '7px solid #10B981'
                  : isWrongPosition
                  ? '7px solid #EF4444'
                  : `7px solid ${theme.accentBar}`,
                borderRadius: '16px',
                padding: '12px 14px',
                boxShadow: isCurrentDragged
                  ? `0 14px 30px ${theme.glowColor}`
                  : '0 3px 10px rgba(15, 23, 42, 0.05)',
                transform: isCurrentDragged ? 'scale(1.025)' : 'none',
                opacity: isCurrentDragged ? 0.96 : 1,
                position: 'relative',
                zIndex: isCurrentDragged ? 10 : 1,
                transition: isCurrentDragged ? 'none' : 'all 0.18s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {/* Step Slot Number Badge (High Contrast & Clear) */}
              <div
                onPointerDown={!isSubmitted ? (e) => handlePointerDown(e, idx) : undefined}
                style={{
                  minWidth: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: isCorrectPosition
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : isWrongPosition
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : theme.badgeBg,
                  color: '#FFFFFF',
                  boxShadow: isCorrectPosition
                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                    : isWrongPosition
                    ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                    : `0 4px 12px ${theme.glowColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: !isSubmitted ? 'grab' : 'default',
                  touchAction: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.75)'
                }}
                title="แตะค้างแล้วลากสลับตำแหน่ง"
              >
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.92, lineHeight: 1, letterSpacing: '0.5px' }}>
                  ลำดับ
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
                  {idx + 1}
                </span>
              </div>

              {/* Step Text Content with Distinct Choice Tag */}
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#FFFFFF',
                      border: `1px solid ${theme.borderColor}`,
                      color: theme.subText,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '1px 8px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>{theme.symbol}</span> ขั้นตอน {theme.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}
                >
                  {item.text}
                </div>
              </div>

              {/* Status indicator after result */}
              {result && (
                <div style={{ flexShrink: 0 }}>
                  {isCorrectPosition ? (
                    <CheckCircle2 size={24} color="#10B981" />
                  ) : (
                    <XCircle size={24} color="#EF4444" />
                  )}
                </div>
              )}

              {/* Reordering Controls (Up / Down Arrows + Drag Grip) */}
              {!isSubmitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    style={{
                      background: idx === 0 ? '#F1F5F9' : '#FFFFFF',
                      color: idx === 0 ? '#94A3B8' : theme.accentBar,
                      border: idx === 0 ? '1px solid #E2E8F0' : `1.5px solid ${theme.borderColor}`,
                      borderRadius: '10px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      boxShadow: idx === 0 ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp size={17} strokeWidth={2.5} />
                  </button>

                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    style={{
                      background: idx === items.length - 1 ? '#F1F5F9' : '#FFFFFF',
                      color: idx === items.length - 1 ? '#94A3B8' : theme.accentBar,
                      border: idx === items.length - 1 ? '1px solid #E2E8F0' : `1.5px solid ${theme.borderColor}`,
                      borderRadius: '10px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                      boxShadow: idx === items.length - 1 ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                    title="เลื่อนลง"
                  >
                    <ArrowDown size={17} strokeWidth={2.5} />
                  </button>

                  <div
                    onPointerDown={(e) => handlePointerDown(e, idx)}
                    style={{
                      color: isCurrentDragged ? theme.accentBar : '#64748B',
                      cursor: isCurrentDragged ? 'grabbing' : 'grab',
                      padding: '6px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      touchAction: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                    title="แตะค้างแล้วลากสลับตำแหน่ง (Drag to reorder)"
                  >
                    <GripVertical size={22} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.correctSequence.map((step, sIdx) => {
              const stepTheme = getSequenceTheme(step, question?.sequenceItems || result.correctSequence);
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    background: stepTheme.cardBg,
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: `1.5px solid ${stepTheme.borderColor}`,
                    borderLeft: `6px solid ${stepTheme.accentBar}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <span
                    style={{
                      background: stepTheme.badgeBg,
                      color: '#FFFFFF',
                      width: '30px',
                      height: '30px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      flexShrink: 0,
                      boxShadow: `0 2px 6px ${stepTheme.glowColor}`
                    }}
                  >
                    {sIdx + 1}
                  </span>
                  <span
                    style={{
                      background: '#FFFFFF',
                      border: `1px solid ${stepTheme.borderColor}`,
                      color: stepTheme.subText,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}
                  >
                    {stepTheme.symbol} {stepTheme.label}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

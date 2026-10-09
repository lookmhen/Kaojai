import React, { useRef, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';

const WHEEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9',
  '#F39C12', '#16A085', '#2980B9', '#8E44AD', '#27AE60',
  '#D35400', '#C0392B', '#1ABC9C', '#3498DB', '#9B59B6'
];

export const LuckyWheel = ({
  candidates = [],
  isSpinning = false,
  winnerIndex = -1,
  duration = 4500,
  onSpinEnd = null,
  size = 400
}) => {
  const canvasRef = useRef(null);
  const currentAngleRef = useRef(0);
  const animFrameRef = useRef(null);
  const lastTickSegmentRef = useRef(-1);

  // Ease-out quartic curve: fast start, dramatic deceleration
  const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = candidates.length;
    if (count === 0) {
      drawEmptyWheel(ctx, canvas.width, canvas.height);
      return;
    }

    const arc = (2 * Math.PI) / count;

    const render = (angle) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = centerX - 18;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Draw segments
      for (let i = 0; i < count; i++) {
        const segAngle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, segAngle, segAngle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.rotate(segAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "Prompt", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;

        const candidateName = typeof candidates[i] === 'string'
          ? candidates[i]
          : (candidates[i]?.name || `คน ${i + 1}`);

        const maxLen = count > 30 ? 7 : (count > 15 ? 10 : 15);
        const displayName = candidateName.length > maxLen
          ? candidateName.substring(0, maxLen - 1) + '…'
          : candidateName;

        ctx.fillText(displayName, radius - 20, 5);
        ctx.restore();
      }

      ctx.restore();

      // Outer gold rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Outer rim dots
      const numDots = Math.min(24, Math.max(12, count));
      for (let d = 0; d < numDots; d++) {
        const dotAngle = (d / numDots) * 2 * Math.PI;
        const dx = centerX + (radius + 4) * Math.cos(dotAngle);
        const dy = centerY + (radius + 4) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      // Center cap
      ctx.beginPath();
      ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Pointer (Top needle pointing down to 12 o'clock)
      ctx.save();
      ctx.translate(centerX, centerY - radius + 8);
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(16, -20);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fillStyle = '#DC2626';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.restore();
    };

    if (!isSpinning) {
      render(currentAngleRef.current);
      return;
    }

    // Spin animation logic
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;
    const extraRotations = 6 + Math.floor(Math.random() * 3); // 6-8 full spins

    // Top pointer is at -Math.PI / 2 (12 o'clock).
    // Segment i spans from (startAngle + i * arc) to (startAngle + (i+1) * arc).
    // For segment winnerIndex to align with pointer at 12 o'clock:
    // pointerAngle = -Math.PI / 2.
    // (finalAngle + winnerIndex * arc + arc/2) % 2PI = -Math.PI / 2
    const targetSegmentCenter = winnerIndex * arc + arc / 2;
    // Align target segment center to top (-Math.PI/2)
    const normalizedTarget = (3 * Math.PI / 2) - targetSegmentCenter;
    const totalSpinAngle = (extraRotations * 2 * Math.PI) + (normalizedTarget - (startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const finalAngle = startAngle + totalSpinAngle;

    lastTickSegmentRef.current = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(progress);
      const currentAngle = startAngle + totalSpinAngle * eased;
      currentAngleRef.current = currentAngle;

      // Audio tick calculation
      const currentPointerOffset = (3 * Math.PI / 2) - (currentAngle % (2 * Math.PI));
      const posPointer = (currentPointerOffset % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const activeSeg = Math.floor(posPointer / arc) % count;

      if (activeSeg !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = activeSeg;
        sfx.playTick();
      }

      render(currentAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentAngleRef.current = finalAngle;
        render(finalAngle);
        if (onSpinEnd) {
          onSpinEnd();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [candidates, isSpinning, winnerIndex, duration]);

  const drawEmptyWheel = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = centerX - 18;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 15px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ยังไม่มีรายชื่อผู้เข้าร่วม', centerX, centerY);
    ctx.font = '12px "Prompt", sans-serif';
    ctx.fillText('เพิ่มรายชื่อหรือดึงจากห้องเพื่อเริ่มหมุน', centerX, centerY + 24);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          maxWidth: '100%',
          height: 'auto',
          filter: isSpinning ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.18))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.08))',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  );
};

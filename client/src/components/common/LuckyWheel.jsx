import React, { useRef, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';

// 16 Festive Carnival Mystery Segments (วงล้อปริศนาหลากสีสันสดใส)
const MYSTERY_SEGMENTS = [
  { icon: '⭐️', label: 'STAR', color: '#EF4444', text: '#FFFFFF' },
  { icon: '🎁', label: 'GIFT', color: '#F97316', text: '#FFFFFF' },
  { icon: '💎', label: 'GEM', color: '#F59E0B', text: '#FFFFFF' },
  { icon: '🍀', label: 'LUCK', color: '#10B981', text: '#FFFFFF' },
  { icon: '✨', label: 'SHINE', color: '#06B6D4', text: '#FFFFFF' },
  { icon: '👑', label: 'KING', color: '#3B82F6', text: '#FFFFFF' },
  { icon: '🎯', label: 'AIM', color: '#6366F1', text: '#FFFFFF' },
  { icon: '🌟', label: 'GOLD', color: '#8B5CF6', text: '#FFFFFF' },
  { icon: '🔮', label: 'MYSTERY', color: '#EC4899', text: '#FFFFFF' },
  { icon: '🏆', label: 'TROPHY', color: '#F43F5E', text: '#FFFFFF' },
  { icon: '🌈', label: 'COLOR', color: '#14B8A6', text: '#FFFFFF' },
  { icon: '🎈', label: 'BALLOON', color: '#84CC16', text: '#FFFFFF' },
  { icon: '🎉', label: 'FEST', color: '#EAB308', text: '#FFFFFF' },
  { icon: '⚡️', label: 'POWER', color: '#0EA5E9', text: '#FFFFFF' },
  { icon: '❤️', label: 'HEART', color: '#A855F7', text: '#FFFFFF' },
  { icon: '🍀', label: 'CLOVER', color: '#059669', text: '#FFFFFF' }
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

  // Ease-out quartic curve: fast start, dramatic suspenseful deceleration
  const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hasCandidates = candidates.length > 0;

    if (!hasCandidates) {
      drawEmptyWheel(ctx, canvas.width, canvas.height);
      return;
    }

    const segments = MYSTERY_SEGMENTS;
    const count = segments.length;
    const arc = (2 * Math.PI) / count;

    const render = (angle) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = centerX - 18;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // 1. Draw Mystery Segments (ชิ้นส่วนวงล้อปริศนา)
      for (let i = 0; i < count; i++) {
        const seg = segments[i];
        const segAngle = i * arc;

        ctx.beginPath();
        ctx.fillStyle = seg.color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, segAngle, segAngle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        // White dividing border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw Mystery Icon (ไอคอนสัญลักษณ์นำโชค)
        ctx.save();
        ctx.rotate(segAngle + arc / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer Mystery Icon
        ctx.font = '22px sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 4;
        ctx.fillText(seg.icon, radius * 0.72, 0);

        // Inner Subtext
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 9.5px "Prompt", sans-serif';
        ctx.shadowBlur = 2;
        ctx.fillText(seg.label, radius * 0.42, 0);
        ctx.restore();
      }

      ctx.restore();

      // 2. Outer Golden Brass Rim (ขอบวงล้อสีทองพร้อมไฟนีออน)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 9;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Golden Rim Light Bulbs
      const numDots = 24;
      for (let d = 0; d < numDots; d++) {
        const dotAngle = (d / numDots) * 2 * Math.PI;
        const dx = centerX + (radius + 4) * Math.cos(dotAngle);
        const dy = centerY + (radius + 4) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = d % 2 === 0 ? '#FEF08A' : '#FFFFFF';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = isSpinning ? 6 : 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Center Hub & Brass Badge (ดุมกลางวงล้อลายดาวนำโชค)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', centerX, centerY);

      // 4. Pointer Flapper (เข็มชี้ด้านบนชี้ลงมาที่ตำแหน่ง 12 นาฬิกา)
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
      ctx.shadowBlur = 5;
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

    // Map winnerIndex into one of the 16 mystery segments
    const targetSegIndex = winnerIndex >= 0 ? (winnerIndex % count) : Math.floor(Math.random() * count);

    // Target segment center aligns to top needle at -Math.PI / 2
    const targetSegmentCenter = targetSegIndex * arc + arc / 2;
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

      // Audio tick calculation when crossing mystery segments
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
          filter: isSpinning ? 'drop-shadow(0 12px 24px rgba(245, 158, 11, 0.28))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';

const BALL_PALETTES = [
  { main: '#FF5E62', highlight: '#FFA8A8', rim: '#D9383D' },
  { main: '#00C6FF', highlight: '#80E3FF', rim: '#0072FF' },
  { main: '#10B981', highlight: '#6EE7B7', rim: '#047857' },
  { main: '#F59E0B', highlight: '#FDE68A', rim: '#B45309' },
  { main: '#8B5CF6', highlight: '#C4B5FD', rim: '#6D28D9' },
  { main: '#EC4899', highlight: '#FBCFE8', rim: '#BE185D' },
  { main: '#06B6D4', highlight: '#67E8F9', rim: '#0E7490' },
  { main: '#F97316', highlight: '#FDBA74', rim: '#C2410C' }
];

const MYSTERY_ICONS = ['⭐️', '🎁', '💎', '🍀', '✨', '👑', '🎯', '🌟', '🔮', '🎉', '⚡️', '❤️'];

export const LuckyWaterPool = ({
  candidates = [],
  onSelectWinner = null,
  isLocked = false,
  width = 600,
  height = 440
}) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    balls: [],
    bubbles: [],
    splashes: [],
    drips: [],
    sparkles: [],
    ripples: [],
    mouse: { x: -100, y: -100, vx: 0, vy: 0, prevX: -100, prevY: -100, isHover: false },
    scoopedBall: null,
    scoopStartPos: { x: 0, y: 0 },
    hasSplashedOnExit: false,
    liftProgress: 0
  });

  // Tub & Water Geometry (2.5D Isometric Cylindrical Pool)
  const cx = width / 2;
  const topCy = 125;
  const rx = 240;
  const ry = 80;
  const tubHeight = 175;
  const botCy = topCy + tubHeight;

  // Recessed Water Surface inside the tub rim
  const waterCy = topCy + 14;
  const waterRx = rx - 12;
  const waterRy = ry - 8;

  // Initialize Mystery Floating Balls (อ้างอิงตามจำนวนคน แต่จำกัด Max Cap 10 ลูก ไม่ให้ล้นและไม่หน่วง)
  useEffect(() => {
    const state = stateRef.current;
    // ป้องกันการรีเซ็ตลูกบอล หากกำลังมีลูกบอลถูกช้อนขึ้นมาอยู่
    if (state.scoopedBall) {
      return;
    }
    const candidateCount = candidates.length;
    const MAX_BALLS = 10;
    const numBalls = Math.min(candidateCount, MAX_BALLS);

    const ballBaseRadius = numBalls <= 3 ? 26 : (numBalls <= 6 ? 24 : 21);

    const balls = [];
    if (numBalls > 0) {
      if (numBalls === 1) {
        // 1 ball at center
        balls.push({
          id: 'mystery_ball_0',
          icon: MYSTERY_ICONS[0],
          ballNumber: 1,
          x: cx,
          y: waterCy,
          vx: 0,
          vy: 0,
          radius: ballBaseRadius,
          palette: BALL_PALETTES[0],
          angle: 0,
          vAngle: 0,
          bobPhase: 0
        });
      } else if (numBalls === 2) {
        // 2 balls: Left & Right with wide spacing
        const coords = [
          { x: cx - 78, y: waterCy },
          { x: cx + 78, y: waterCy }
        ];
        coords.forEach((pos, i) => {
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.9
          });
        });
      } else if (numBalls === 3) {
        // 3 balls: Balanced Triangle
        const coords = [
          { x: cx, y: waterCy - 26 },
          { x: cx - 85, y: waterCy + 18 },
          { x: cx + 85, y: waterCy + 18 }
        ];
        coords.forEach((pos, i) => {
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.9
          });
        });
      } else if (numBalls === 4) {
        // 4 balls: Staggered Diamond/Oval
        const coords = [
          { x: cx + 110, y: waterCy },
          { x: cx, y: waterCy + 28 },
          { x: cx - 110, y: waterCy },
          { x: cx, y: waterCy - 28 }
        ];
        coords.forEach((pos, i) => {
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.9
          });
        });
      } else if (numBalls === 5) {
        // 5 balls: Staggered Pentagon Ring
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(ang) * 120;
          const y = waterCy + Math.sin(ang) * 32;
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.9
          });
        }
      } else if (numBalls === 6) {
        // 6 balls: Oval Ring
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const x = cx + Math.cos(ang) * 135;
          const y = waterCy + Math.sin(ang) * 36;
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.9
          });
        }
      } else if (numBalls === 7) {
        // 7 balls: 1 Center + 6 Oval Ring
        balls.push({
          id: 'mystery_ball_0',
          icon: MYSTERY_ICONS[0],
          ballNumber: 1,
          x: cx,
          y: waterCy,
          vx: 0,
          vy: 0,
          radius: ballBaseRadius,
          palette: BALL_PALETTES[0],
          angle: 0,
          vAngle: 0,
          bobPhase: 0
        });
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const x = cx + Math.cos(ang) * 140;
          const y = waterCy + Math.sin(ang) * 38;
          balls.push({
            id: `mystery_ball_${i + 1}`,
            icon: MYSTERY_ICONS[(i + 1) % MYSTERY_ICONS.length],
            ballNumber: i + 2,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[(i + 1) % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: (i + 1) * 0.8
          });
        }
      } else if (numBalls === 8) {
        // 8 balls: 2 Inner + 6 Outer Ring (Rotated offset for zero overlap)
        const inner = [
          { x: cx - 52, y: waterCy },
          { x: cx + 52, y: waterCy }
        ];
        inner.forEach((pos, i) => {
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.8
          });
        });
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
          const x = cx + Math.cos(ang) * 144;
          const y = waterCy + Math.sin(ang) * 38;
          balls.push({
            id: `mystery_ball_${i + 2}`,
            icon: MYSTERY_ICONS[(i + 2) % MYSTERY_ICONS.length],
            ballNumber: i + 3,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[(i + 2) % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: (i + 2) * 0.8
          });
        }
      } else if (numBalls === 9) {
        // 9 balls: 1 Center + 8 Outer Ring (Offset for zero overlap)
        balls.push({
          id: 'mystery_ball_0',
          icon: MYSTERY_ICONS[0],
          ballNumber: 1,
          x: cx,
          y: waterCy,
          vx: 0,
          vy: 0,
          radius: ballBaseRadius,
          palette: BALL_PALETTES[0],
          angle: 0,
          vAngle: 0,
          bobPhase: 0
        });
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const x = cx + Math.cos(ang) * 146;
          const y = waterCy + Math.sin(ang) * 39;
          balls.push({
            id: `mystery_ball_${i + 1}`,
            icon: MYSTERY_ICONS[(i + 1) % MYSTERY_ICONS.length],
            ballNumber: i + 2,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[(i + 1) % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: (i + 1) * 0.8
          });
        }
      } else if (numBalls === 10) {
        // 10 balls: 2 Inner + 8 Outer Ring (Max cap 10, perfectly non-overlapping)
        const inner = [
          { x: cx - 40, y: waterCy },
          { x: cx + 40, y: waterCy }
        ];
        inner.forEach((pos, i) => {
          balls.push({
            id: `mystery_ball_${i}`,
            icon: MYSTERY_ICONS[i % MYSTERY_ICONS.length],
            ballNumber: i + 1,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[i % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: i * 0.8
          });
        });
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const x = cx + Math.cos(ang) * 148;
          const y = waterCy + Math.sin(ang) * 40;
          balls.push({
            id: `mystery_ball_${i + 2}`,
            icon: MYSTERY_ICONS[(i + 2) % MYSTERY_ICONS.length],
            ballNumber: i + 3,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: ballBaseRadius,
            palette: BALL_PALETTES[(i + 2) % BALL_PALETTES.length],
            angle: 0,
            vAngle: 0,
            bobPhase: (i + 2) * 0.8
          });
        }
      }
    }

    state.balls = balls;
    state.scoopedBall = null;
    state.hasSplashedOnExit = false;
    state.liftProgress = 0;
    state.ripples = [];
    state.splashes = [];
    state.drips = [];
    state.sparkles = [];
  }, [candidates, width, height, cx, waterCy, waterRx, waterRy]);

  // Main Canvas Render & Physics Loop (Optimized 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // 1. FLOOR SHADOW BENEATH TUB (Fast Radial Gradient, No Blur Filter)
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, botCy + 14, rx * 0.95, ry * 0.48, 0, 0, Math.PI * 2);
      const floorGrad = ctx.createRadialGradient(cx, botCy + 14, 20, cx, botCy + 14, rx * 0.95);
      floorGrad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
      floorGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.08)');
      floorGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = floorGrad;
      ctx.fill();
      ctx.restore();

      // ==========================================
      // 2. CYLINDRICAL TUB OUTER WALL (ตัวถัง/อ่างน้ำทรงกระบอก)
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - rx, topCy);
      ctx.lineTo(cx - rx, botCy);
      ctx.ellipse(cx, botCy, rx, ry, 0, Math.PI, 0, true);
      ctx.lineTo(cx + rx, topCy);
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI, false);
      ctx.closePath();

      const wallGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      wallGrad.addColorStop(0, '#0369A1');
      wallGrad.addColorStop(0.12, '#38BDF8');
      wallGrad.addColorStop(0.35, '#0284C7');
      wallGrad.addColorStop(0.75, '#0369A1');
      wallGrad.addColorStop(1, '#075985');
      ctx.fillStyle = wallGrad;
      ctx.fill();

      // Barrel Ribs / Metal Bands
      const drawBand = (bandY) => {
        ctx.beginPath();
        ctx.ellipse(cx, bandY, rx + 1.5, ry + 0.5, 0, 0, Math.PI, false);
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, bandY + 2.5, rx + 1.5, ry + 0.5, 0, 0, Math.PI, false);
        ctx.strokeStyle = 'rgba(7, 89, 133, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      drawBand(topCy + tubHeight * 0.45);
      drawBand(topCy + tubHeight * 0.85);

      // Outer border stroke
      ctx.beginPath();
      ctx.moveTo(cx - rx, topCy);
      ctx.lineTo(cx - rx, botCy);
      ctx.ellipse(cx, botCy, rx, ry, 0, Math.PI, 0, true);
      ctx.lineTo(cx + rx, topCy);
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 3. TUB TOP RIM LIP & INNER BACK WALL
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#075985';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, topCy - 1, rx - 3, ry - 3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 4. WATER SURFACE INSIDE THE TUB
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, waterCy, waterRx, waterRy, 0, 0, Math.PI * 2);

      const waterGrad = ctx.createRadialGradient(cx, waterCy - 15, 10, cx, waterCy, waterRx);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
      waterGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.85)');
      waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.95)');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (candidates.length === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ยังไม่มีรายชื่อผู้มีสิทธิ์ลุ้นรางวัล', cx, waterCy - 8);
        ctx.font = '12px "Prompt", sans-serif';
        ctx.fillStyle = '#E0F2FE';
        ctx.fillText('เพิ่มรายชื่อหรือเชื่อมต่อห้องเพื่อเริ่มสอยลูกบอล', cx, waterCy + 14);
      }
      ctx.restore();

      // ==========================================
      // 5. WATER RIPPLES & BUBBLES
      // ==========================================
      if (Math.random() < 0.05 && state.ripples.length < 6) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.7;
        state.ripples.push({
          x: cx + Math.cos(ang) * (waterRx * dist),
          y: waterCy + Math.sin(ang) * (waterRy * dist),
          r: 2,
          maxR: 42 + Math.random() * 25,
          alpha: 0.65
        });
      }

      for (let i = state.ripples.length - 1; i >= 0; i--) {
        const rip = state.ripples[i];
        rip.r += 0.95;
        rip.alpha *= 0.96;

        if (rip.alpha <= 0.02 || rip.r >= rip.maxR) {
          state.ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        const ryRatio = waterRy / waterRx;
        ctx.ellipse(rip.x, rip.y, rip.r, rip.r * ryRatio, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.75})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Air Bubbles
      if (Math.random() < 0.18 && state.bubbles.length < 10) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.75;
        state.bubbles.push({
          x: cx + Math.cos(ang) * (waterRx * dist),
          y: waterCy + (Math.random() * 20 - 5),
          radius: 2 + Math.random() * 3,
          vy: -(0.3 + Math.random() * 0.7),
          vx: (Math.random() - 0.5) * 0.3,
          life: 1
        });
      }

      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        const b = state.bubbles[i];
        b.y += b.vy;
        b.x += b.vx;
        b.life -= 0.016;

        if (b.life <= 0 || b.y < waterCy - waterRy * 0.8) {
          state.bubbles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.life * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(224, 242, 254, ${b.life * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ==========================================
      // 6. BALL PHYSICS & PICKUP ROD STIRRING (ตอบสนองไว ไม่หน่วง)
      // ==========================================
      const mouse = state.mouse;
      const isScooping = Boolean(state.scoopedBall);
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);

      for (let i = 0; i < state.balls.length; i++) {
        const b = state.balls[i];

        if (state.scoopedBall && state.scoopedBall.id === b.id) {
          continue;
        }

        // Water drag
        b.vx *= 0.91;
        b.vy *= 0.91;
        b.vAngle *= 0.90;

        // Cut off tiny movements
        if (Math.abs(b.vx) < 0.02) b.vx = 0;
        if (Math.abs(b.vy) < 0.02) b.vy = 0;
        if (Math.abs(b.vAngle) < 0.005) b.vAngle = 0;

        // Pickup Rod Stirring Interaction: ตอบสนองต่อการกวนไม้ทันที!
        if (mouse.isHover) {
          const mdx = b.x - mouse.x;
          const mdy = b.y - mouse.y;
          const dist = Math.hypot(mdx, mdy);
          const stirRadius = 78;

          if (dist < stirRadius && mouseSpeed > 0.4) {
            const proximity = 1 - dist / stirRadius;
            const push = proximity * Math.min(4.5, mouseSpeed * 0.32 + 0.8);
            b.vx += (mdx / (dist || 1)) * push + mouse.vx * 0.16;
            b.vy += (mdy / (dist || 1)) * push + mouse.vy * 0.16;
            b.vAngle += (Math.random() - 0.5) * 0.08;

            if (Math.random() < 0.15) {
              state.ripples.push({
                x: mouse.x,
                y: mouse.y,
                r: 4,
                maxR: 44,
                alpha: 0.6
              });
            }
          }
        }

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;

        // Elliptical Boundary Collision
        const effectiveRx = waterRx - b.radius - 4;
        const effectiveRy = waterRy - b.radius - 4;
        const normX = (b.x - cx) / effectiveRx;
        const normY = (b.y - waterCy) / effectiveRy;
        const normDist = Math.hypot(normX, normY);

        if (normDist > 1) {
          b.x = cx + (normX / normDist) * effectiveRx;
          b.y = waterCy + (normY / normDist) * effectiveRy;

          let nx = normX / (effectiveRx * effectiveRx);
          let ny = normY / (effectiveRy * effectiveRy);
          const nlen = Math.hypot(nx, ny) || 1;
          nx /= nlen;
          ny /= nlen;

          const dot = b.vx * nx + b.vy * ny;
          if (dot > 0) {
            b.vx -= 1.4 * dot * nx;
            b.vy -= 1.4 * dot * ny;
          }
        }

        // Ball-to-ball soft collisions
        for (let j = i + 1; j < state.balls.length; j++) {
          const b2 = state.balls[j];
          if (state.scoopedBall && state.scoopedBall.id === b2.id) continue;

          const cdx = b2.x - b.x;
          const cdy = b2.y - b.y;
          const cdist = Math.hypot(cdx, cdy);
          const minDist = b.radius + b2.radius;

          if (cdist < minDist && cdist > 0) {
            const overlap = (minDist - cdist) * 0.3;
            const cnx = cdx / cdist;
            const cny = cdy / cdist;

            b.x -= cnx * overlap;
            b.y -= cny * overlap;
            b2.x += cnx * overlap;
            b2.y += cny * overlap;

            const relVel = (b.vx - b2.vx) * cnx + (b.vy - b2.vy) * cny;
            if (relVel > 0.1) {
              const impulse = relVel * 0.65;
              b.vx -= impulse * cnx;
              b.vy -= impulse * cny;
              b2.vx += impulse * cnx;
              b2.vy += impulse * cny;

              if (relVel > 1.3) {
                sfx.playBallClack();
              }
            }
          }
        }
      }

      // Softly decay mouse velocity each frame
      state.mouse.vx *= 0.5;
      state.mouse.vy *= 0.5;

      // ==========================================
      // 7. RENDER FLOATING BALLS WITH 2.5D DEPTH
      // ==========================================
      const sortedBalls = [...state.balls].sort((a, b) => a.y - b.y);

      for (const b of sortedBalls) {
        if (state.scoopedBall && state.scoopedBall.id === b.id) continue;

        const depthY = (b.y - (waterCy - waterRy)) / (2 * waterRy);
        const depthScale = 0.90 + Math.max(0, Math.min(1, depthY)) * 0.20;

        drawBall(ctx, b, depthScale);
      }

      // Front Rim Lip of the Tub
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI, false);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, topCy - 1, rx - 3, ry - 3, 0, 0, Math.PI, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 8. PICKUP ROD (เมาส์บังคับคันเบ็ด/ไม้เกี่ยวสอยดาว)
      // ==========================================
      if (!isScooping && mouse.isHover) {
        drawPickupRod(ctx, mouse.x, mouse.y, false);
      }

      // ==========================================
      // 9. SCOOPING MOTION WITH PICKUP ROD & CELEBRATION
      // ==========================================
      if (state.scoopedBall) {
        state.liftProgress = Math.min(1, state.liftProgress + 0.016);
        const t = state.liftProgress;
        const sb = state.scoopedBall;
        const start = state.scoopStartPos;
        const targetX = cx;
        const targetY = topCy - 55;

        let currentX, currentY, scale;

        if (t < 0.22) {
          const p = t / 0.22;
          const dipY = Math.sin(p * Math.PI) * 12;
          currentX = start.x;
          currentY = start.y + dipY;
          scale = 1.0;
        } else if (t < 0.72) {
          const p = (t - 0.22) / 0.5;
          const ease = 1 - Math.pow(1 - p, 3);
          currentX = start.x + (targetX - start.x) * ease;
          currentY = start.y + (targetY - start.y) * ease;
          scale = 1 + ease * 0.45;

          if (currentY <= waterCy + 10 && !state.hasSplashedOnExit) {
            state.hasSplashedOnExit = true;
            sfx.playWaterSplash();

            for (let k = 0; k < 28; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 2.2 + Math.random() * 4.2;
              state.splashes.push({
                x: currentX + (Math.random() - 0.5) * 30,
                y: waterCy,
                vx: Math.cos(ang) * spd,
                vy: -Math.abs(Math.sin(ang)) * spd - 1.2,
                radius: 2 + Math.random() * 3.5,
                life: 1
              });
            }

            state.ripples.push({
              x: currentX,
              y: waterCy,
              r: 4,
              maxR: 90,
              alpha: 1
            });
          }
        } else {
          const p = (t - 0.72) / 0.28;
          currentX = targetX;
          currentY = targetY;
          scale = 1.45 + p * 0.45;

          if (Math.random() < 0.65) {
            state.drips.push({
              x: currentX + (Math.random() - 0.5) * 36,
              y: currentY + 30,
              vy: 2.5 + Math.random() * 2.5,
              radius: 1.5 + Math.random() * 2,
              life: 1
            });
          }

          if (Math.random() < 0.35) {
            state.sparkles.push({
              x: currentX + (Math.random() - 0.5) * (sb.radius * scale * 1.4),
              y: currentY + (Math.random() - 0.5) * (sb.radius * scale * 1.4),
              size: 4 + Math.random() * 6,
              life: 1
            });
          }
        }

        // Golden aura ring around winner ball
        if (t > 0.58) {
          const auraProgress = (t - 0.58) / 0.42;
          ctx.save();
          ctx.beginPath();
          ctx.arc(currentX, currentY, sb.radius * scale + 16, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${auraProgress * 0.38})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(251, 191, 36, ${auraProgress * 0.9})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }

        drawPickupRod(ctx, currentX, currentY, true);
        drawBall(ctx, { ...sb, x: currentX, y: currentY }, scale);
      }

      // Splashing droplets
      for (let i = state.splashes.length - 1; i >= 0; i--) {
        const s = state.splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.18;
        s.life -= 0.035;

        if (s.life <= 0 || s.y > botCy) {
          state.splashes.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${s.life * 0.9})`;
        ctx.fill();
      }

      // Water drips
      for (let i = state.drips.length - 1; i >= 0; i--) {
        const d = state.drips[i];
        d.y += d.vy;
        d.vy += 0.15;

        if (d.y >= waterCy) {
          state.ripples.push({
            x: d.x,
            y: waterCy,
            r: 2,
            maxR: 32,
            alpha: 0.5
          });
          state.drips.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.fill();
      }

      // Sparkles
      for (let i = state.sparkles.length - 1; i >= 0; i--) {
        const sp = state.sparkles[i];
        sp.life -= 0.045;

        if (sp.life <= 0) {
          state.sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sp.life * 0.9})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-sp.size, 0);
        ctx.lineTo(sp.size, 0);
        ctx.moveTo(0, -sp.size);
        ctx.lineTo(0, sp.size);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [candidates, width, height, cx, topCy, rx, ry, tubHeight, botCy, waterCy, waterRx, waterRy]);

  // Helper: Draw 3D Floating Mystery Ball (Optimized, No heavy shadowBlur)
  const drawBall = (ctx, ball, scale = 1) => {
    const { x, y, radius, palette, icon, bobPhase } = ball;
    const r = radius * scale;

    const bobOffset = Math.sin(Date.now() * 0.0018 + (bobPhase || 0)) * 1.3;

    ctx.save();
    ctx.translate(x, y + bobOffset);

    // 1. Soft Shadow on Water Surface
    ctx.beginPath();
    ctx.ellipse(0, r * 0.8, r * 0.82, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(3, 105, 161, 0.32)';
    ctx.fill();

    // 2. 3D Spherical Body Gradient
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, palette.highlight);
    grad.addColorStop(0.45, palette.main);
    grad.addColorStop(1, palette.rim);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer Rim Stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    // 3. Mystery Emblem / Icon (Crisp rendering without expensive software shadowBlur)
    ctx.save();
    ctx.font = `${Math.round(15 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon || '⭐️', 0, 1 * scale);
    ctx.restore();

    // 4. Specular Glare (Reflection shine on top-left)
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.38, r * 0.28, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw Pickup Rod matching user's sketch
  const drawPickupRod = (ctx, tipX, tipY, isCatching) => {
    ctx.save();

    const rodLength = 220;
    const angle = -Math.PI / 4;
    const endX = tipX - Math.cos(angle) * rodLength;
    const endY = tipY - Math.sin(angle) * rodLength;

    // 1. ROD SHAFT
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const drawCollar = (ratio) => {
      const cxCollar = tipX + (endX - tipX) * ratio;
      const cyCollar = tipY + (endY - tipY) * ratio;
      ctx.beginPath();
      ctx.arc(cxCollar, cyCollar, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    drawCollar(0.18);
    drawCollar(0.48);
    drawCollar(0.78);

    // 2. PICKUP ROD HEAD
    const boxSize = 42;
    ctx.save();
    ctx.translate(tipX, tipY);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-boxSize / 2 + 4, -boxSize / 2 + 6, boxSize, boxSize, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 8);
    ctx.fillStyle = isCatching ? '#FEF3C7' : '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = isCatching ? '#F59E0B' : '#0284C7';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    ctx.strokeStyle = isCatching ? '#F59E0B' : '#38BDF8';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-boxSize / 2 + 7, -boxSize / 2 + 7, boxSize - 14, boxSize - 14);

    ctx.beginPath();
    ctx.moveTo(-boxSize / 2 + 4, 0);
    ctx.lineTo(boxSize / 2 - 4, 0);
    ctx.moveTo(0, -boxSize / 2 + 4);
    ctx.lineTo(0, boxSize / 2 - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isCatching ? '#EF4444' : '#10B981';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isCatching ? '#B45309' : '#0369A1';
    ctx.font = 'bold 7.5px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PICKUP', 0, -boxSize / 2 - 2);

    ctx.restore();
    ctx.restore();
  };

  // Mouse Move: Instant, responsive velocity tracking
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || isLocked || stateRef.current.scoopedBall) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;
    const prevX = state.mouse.prevX === -100 ? x : state.mouse.prevX;
    const prevY = state.mouse.prevY === -100 ? y : state.mouse.prevY;
    const vx = x - prevX;
    const vy = y - prevY;
    const moveDist = Math.hypot(vx, vy);

    state.mouse = {
      x,
      y,
      vx,
      vy,
      prevX: x,
      prevY: y,
      isHover: true
    };

    const normDist = Math.hypot((x - cx) / waterRx, (y - waterCy) / waterRy);
    if (moveDist > 3 && normDist <= 1.1) {
      sfx.playWaterStir(Math.min(1.2, moveDist / 15));
    }
  };

  const handleMouseEnter = () => {
    stateRef.current.mouse.isHover = true;
  };

  const handleMouseLeave = () => {
    stateRef.current.mouse.isHover = false;
  };

  // Click: Scoop up / Pickup a mystery ball with the Pickup Rod!
  const handleClick = (e) => {
    if (isLocked || stateRef.current.scoopedBall || candidates.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;

    let target = state.balls.find((b) => Math.hypot(b.x - x, b.y - y) <= b.radius + 22);
    if (!target && state.balls.length > 0) {
      target = state.balls[Math.floor(Math.random() * state.balls.length)];
    }

    if (!target) return;

    // Fairly draw a winner from eligible candidates
    const chosenWinner = candidates[Math.floor(Math.random() * candidates.length)];

    state.scoopedBall = target;
    state.scoopStartPos = { x: target.x, y: target.y };
    state.hasSplashedOnExit = false;
    state.liftProgress = 0;

    setTimeout(() => {
      if (onSelectWinner && chosenWinner) {
        onSelectWinner(chosenWinner);
      }
    }, 1750);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          cursor: stateRef.current.scoopedBall ? 'default' : 'crosshair',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '24px',
          filter: 'drop-shadow(0 14px 32px rgba(3, 105, 161, 0.22))',
          touchAction: 'none'
        }}
      />

      <div
        style={{
          marginTop: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          color: '#0369A1',
          padding: '7px 20px',
          borderRadius: '24px',
          fontSize: '0.86rem',
          fontWeight: 700
        }}
      >
        <span>🎣 เลื่อนก้าน <strong>Pickup Rod</strong> กวนน้ำวนในอ่างกลม</span>
        <span>•</span>
        <span>🔮 <strong>คลิกเพื่อสอยลูกบอลปริศนา ลุ้นผู้โชคดี!</strong></span>
      </div>
    </div>
  );
};

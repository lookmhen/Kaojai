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
    waves: [],
    mouse: { x: -100, y: -100, prevX: -100, prevY: -100, isHover: false, speed: 0 },
    scoopedBall: null,
    scoopStartPos: { x: 0, y: 0 },
    hasSplashedOnExit: false,
    liftProgress: 0,
    avatarCache: new Map()
  });

  // Initialize waves and balls
  useEffect(() => {
    const state = stateRef.current;
    const waterLevel = 90;
    const numWaves = 36;

    // Wave points across pool
    state.waves = [];
    for (let i = 0; i < numWaves; i++) {
      state.waves.push({ x: (i / (numWaves - 1)) * width, y: waterLevel, vy: 0 });
    }

    // Pre-cache avatar images if available
    candidates.forEach(c => {
      if (c.avatar && !state.avatarCache.has(c.avatar)) {
        const img = new Image();
        img.src = `/avatars/${c.avatar}`;
        state.avatarCache.set(c.avatar, img);
      }
    });

    // Create balls from candidates
    const ballRadius = candidates.length > 30 ? 22 : (candidates.length > 15 ? 26 : 30);
    const poolWidth = width - 80;
    const poolBottom = height - 50;

    state.balls = candidates.map((cand, idx) => {
      const palette = BALL_PALETTES[idx % BALL_PALETTES.length];
      const startX = 50 + (idx % 8) * (poolWidth / 8) + (Math.random() * 20 - 10);
      const startY = waterLevel + 40 + Math.floor(idx / 8) * (ballRadius * 2.2) + (Math.random() * 30);

      const nameStr = cand.name || 'Anonymous';
      const initials = nameStr.length > 2 ? nameStr.substring(0, 2) : nameStr;

      return {
        id: cand.id || `ball_${idx}`,
        candidate: cand,
        x: Math.min(width - 50, Math.max(50, startX)),
        y: Math.min(poolBottom, Math.max(waterLevel + 30, startY)),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: ballRadius,
        palette,
        initials,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.05
      };
    });

    state.scoopedBall = null;
    state.hasSplashedOnExit = false;
    state.liftProgress = 0;
  }, [candidates, width, height]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const waterLevel = 90;
    const tankLeft = 32;
    const tankRight = width - 32;
    const tankBottom = height - 26;

    const render = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, width, height);

      // --- 1. TANK BACKGROUND & GLASS CONTAINER ---
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(tankLeft, 36, tankRight - tankLeft, tankBottom - 36, [16, 16, 28, 28]);
      ctx.fillStyle = '#F0F9FF';
      ctx.fill();
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // --- 2. WATER SIMULATION (Wave equation & filling) ---
      for (let i = 0; i < state.waves.length; i++) {
        const w = state.waves[i];
        const targetY = waterLevel;
        const force = (targetY - w.y) * 0.04;
        w.vy += force;
        w.vy *= 0.94; // Wave damping
        w.y += w.vy;
      }

      // Spread wave energy to neighbors
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < state.waves.length; i++) {
          if (i > 0) {
            const diff = state.waves[i].y - state.waves[i - 1].y;
            state.waves[i - 1].vy += diff * 0.035;
          }
          if (i < state.waves.length - 1) {
            const diff = state.waves[i].y - state.waves[i + 1].y;
            state.waves[i + 1].vy += diff * 0.035;
          }
        }
      }

      // Draw water body
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tankLeft, state.waves[0].y);

      for (let i = 0; i < state.waves.length - 1; i++) {
        const p0 = state.waves[i];
        const p1 = state.waves[i + 1];
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
      }
      ctx.lineTo(tankRight, tankBottom);
      ctx.lineTo(tankLeft, tankBottom);
      ctx.closePath();

      const waterGrad = ctx.createLinearGradient(0, waterLevel, 0, tankBottom);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
      waterGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.7)');
      waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.85)');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Water surface shine line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // --- 3. BUBBLE PARTICLES ---
      if (Math.random() < 0.25) {
        state.bubbles.push({
          x: tankLeft + 20 + Math.random() * (tankRight - tankLeft - 40),
          y: tankBottom - 10,
          radius: 2 + Math.random() * 4,
          vy: -(1 + Math.random() * 1.5),
          vx: (Math.random() - 0.5) * 0.6,
          life: 1
        });
      }

      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        const b = state.bubbles[i];
        b.y += b.vy;
        b.x += b.vx;
        if (b.y < waterLevel) b.life -= 0.1;

        if (b.life <= 0 || b.y < waterLevel - 10) {
          state.bubbles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.life * 0.6})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(224, 242, 254, ${b.life * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- 4. BALL PHYSICS & COLLISIONS ---
      const mouse = state.mouse;
      const isScooping = Boolean(state.scoopedBall);

      for (let i = 0; i < state.balls.length; i++) {
        const b = state.balls[i];

        // Skip normal physics if this ball is being scooped up
        if (state.scoopedBall && state.scoopedBall.id === b.id) {
          continue;
        }

        // Buoyancy force (pulls towards water surface with gentle bobbing)
        const depth = b.y - waterLevel;
        if (depth > 20) {
          b.vy -= 0.14;
        } else if (depth < -5) {
          b.vy += 0.25;
        } else {
          b.vy += Math.sin(Date.now() * 0.003 + i) * 0.03;
        }

        // Water drag / resistance
        b.vx *= 0.965;
        b.vy *= 0.965;

        // Mouse Stirring interaction (กวนน้ำ)
        if (mouse.isHover && mouse.y > waterLevel - 20) {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const stirRadius = 85;

          if (dist < stirRadius && dist > 1) {
            const force = (1 - dist / stirRadius) * 2.4;
            b.vx += (dx / dist) * force + (mouse.speed * 0.12 * Math.sign(dx));
            b.vy += (dy / dist) * force + (mouse.speed * 0.08 * Math.sign(dy));
            b.vAngle += (Math.random() - 0.5) * 0.08;

            const waveIdx = Math.floor((b.x / width) * state.waves.length);
            if (waveIdx >= 0 && waveIdx < state.waves.length) {
              state.waves[waveIdx].vy += force * 0.9;
            }
          }
        }

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;
        b.vAngle *= 0.97;

        // Wall Boundaries
        if (b.x - b.radius < tankLeft + 6) {
          b.x = tankLeft + 6 + b.radius;
          b.vx = Math.abs(b.vx) * 0.7;
        } else if (b.x + b.radius > tankRight - 6) {
          b.x = tankRight - 6 - b.radius;
          b.vx = -Math.abs(b.vx) * 0.7;
        }

        if (b.y + b.radius > tankBottom - 6) {
          b.y = tankBottom - 6 - b.radius;
          b.vy = -Math.abs(b.vy) * 0.6;
        } else if (b.y - b.radius < waterLevel - 25) {
          b.y = waterLevel - 25 + b.radius;
          b.vy = Math.abs(b.vy) * 0.5;
        }

        // Soft Ball Collisions
        for (let j = i + 1; j < state.balls.length; j++) {
          const b2 = state.balls[j];
          if (state.scoopedBall && state.scoopedBall.id === b2.id) continue;

          const cdx = b2.x - b.x;
          const cdy = b2.y - b.y;
          const cdist = Math.hypot(cdx, cdy);
          const minDist = b.radius + b2.radius;

          if (cdist < minDist && cdist > 0) {
            const overlap = (minDist - cdist) * 0.5;
            const nx = cdx / cdist;
            const ny = cdy / cdist;

            b.x -= nx * overlap;
            b.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            const relVel = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
            if (relVel > 0) {
              const impulse = relVel * 0.85;
              b.vx -= impulse * nx;
              b.vy -= impulse * ny;
              b2.vx += impulse * nx;
              b2.vy += impulse * ny;

              if (relVel > 1.2) {
                sfx.playBallClack();
              }
            }
          }
        }

        drawBall(ctx, b, 1);
      }

      // --- 5. MOUSE SCOOPER (When not scooping) ---
      if (!isScooping && mouse.isHover) {
        drawScooper(ctx, mouse.x, mouse.y, false, 0);
      }

      // --- 6. REALISTIC SCOOPING MOTION & WATER SPLASH ---
      if (state.scoopedBall) {
        state.liftProgress = Math.min(1, state.liftProgress + 0.016);
        const t = state.liftProgress;
        const sb = state.scoopedBall;
        const start = state.scoopStartPos;
        const targetX = width / 2;
        const targetY = 62;

        let currentX, currentY, scooperAngle, scale;

        if (t < 0.22) {
          // PHASE 1: Submerge & Slide Under (กระชอนมุดลงไปช้อนใต้ลูกบอล)
          const p = t / 0.22;
          const dipY = Math.sin(p * Math.PI) * 16;
          currentX = start.x;
          currentY = start.y + dipY;
          scooperAngle = -0.22 * Math.sin(p * Math.PI);
          scale = 1.0;
        } else if (t < 0.72) {
          // PHASE 2: Curved Upward Scoop through Water (ช้อนตักโค้งขึ้นผ่านผิวน้ำ)
          const p = (t - 0.22) / 0.5;
          const ease = 1 - Math.pow(1 - p, 3);
          currentX = start.x + (targetX - start.x) * ease;
          currentY = start.y + (targetY - start.y) * ease;
          scooperAngle = 0.25 * (1 - p);
          scale = 1 + ease * 0.45;

          // When passing through waterLevel (breaking surface):
          if (currentY <= waterLevel + 10 && !state.hasSplashedOnExit) {
            state.hasSplashedOnExit = true;
            sfx.playWaterSplash();

            // Big water splash droplets
            for (let k = 0; k < 28; k++) {
              const ang = (Math.PI / 6) + Math.random() * ((2 * Math.PI) / 3);
              const spd = 2.5 + Math.random() * 4.5;
              state.splashes.push({
                x: currentX + (Math.random() - 0.5) * 35,
                y: waterLevel,
                vx: Math.cos(ang) * spd * (Math.random() < 0.5 ? 1 : -1),
                vy: -Math.sin(ang) * spd,
                radius: 2 + Math.random() * 3.5,
                life: 1
              });
            }

            // Big wave ripple at exit point
            const waveIdx = Math.floor((currentX / width) * state.waves.length);
            if (waveIdx >= 0 && waveIdx < state.waves.length) {
              state.waves[waveIdx].vy -= 4.2;
            }
          }
        } else {
          // PHASE 3 & 4: Emergence, Water Dripping & Glistening (ยกช้อนขึ้นมาผึ่งเหนือน้ำ หยดน้ำติ๋งๆ เรืองแสงสีทอง)
          const p = (t - 0.72) / 0.28;
          currentX = targetX;
          currentY = targetY;
          scooperAngle = 0;
          scale = 1.45 + p * 0.45; // Scales up to 1.9x

          // Water drips falling from scooper mesh back into pool
          if (Math.random() < 0.65) {
            state.drips.push({
              x: currentX + (Math.random() - 0.5) * 44,
              y: currentY + 32,
              vy: 2.8 + Math.random() * 2.5,
              radius: 1.5 + Math.random() * 2,
              life: 1
            });
          }

          // Wet ball sparkle glisten
          if (Math.random() < 0.35) {
            state.sparkles.push({
              x: currentX + (Math.random() - 0.5) * (sb.radius * scale * 1.4),
              y: currentY + (Math.random() - 0.5) * (sb.radius * scale * 1.4),
              size: 3 + Math.random() * 5,
              life: 1
            });
          }
        }

        // Golden aura ring around winner ball
        if (t > 0.6) {
          const auraProgress = (t - 0.6) / 0.4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(currentX, currentY, sb.radius * scale + 14, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${auraProgress * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(251, 191, 36, ${auraProgress * 0.85})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Scooper supporting the lifted ball
        drawScooper(ctx, currentX, currentY + 14, true, scooperAngle);

        // Draw the scooped ball
        drawBall(ctx, { ...sb, x: currentX, y: currentY }, scale);
      }

      // Render splashing water droplets
      for (let i = state.splashes.length - 1; i >= 0; i--) {
        const s = state.splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.18; // Gravity
        s.life -= 0.035;

        if (s.life <= 0 || s.y > tankBottom) {
          state.splashes.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${s.life * 0.9})`;
        ctx.fill();
      }

      // Render water drips (สายน้ำหยดติ๋งๆ ลงจากกระชอน)
      for (let i = state.drips.length - 1; i >= 0; i--) {
        const d = state.drips[i];
        d.y += d.vy;
        d.vy += 0.15; // Gravity acceleration

        // Ripple when hit water
        if (d.y >= waterLevel) {
          const waveIdx = Math.floor((d.x / width) * state.waves.length);
          if (waveIdx >= 0 && waveIdx < state.waves.length) {
            state.waves[waveIdx].vy += 0.35;
          }
          state.drips.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.radius, d.radius * 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.fill();
      }

      // Render wet glistens / sparkles on ball
      for (let i = state.sparkles.length - 1; i >= 0; i--) {
        const sp = state.sparkles[i];
        sp.life -= 0.05;

        if (sp.life <= 0) {
          state.sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.fillStyle = `rgba(255, 255, 255, ${sp.life})`;
        ctx.beginPath();
        ctx.arc(0, 0, sp.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${sp.life * 0.8})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-sp.size, 0); ctx.lineTo(sp.size, 0);
        ctx.moveTo(0, -sp.size); ctx.lineTo(0, sp.size);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [width, height]);

  // Helper: Draw 3D Translucent Capsule Ball
  const drawBall = (ctx, b, scale = 1) => {
    const r = b.radius * scale;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // Ball soft shadow
    ctx.beginPath();
    ctx.arc(0, r * 0.3, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 44, 76, 0.15)';
    ctx.fill();

    // Base spherical radial gradient
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, b.palette.highlight);
    grad.addColorStop(0.65, b.palette.main);
    grad.addColorStop(1, b.palette.rim);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Center Avatar or Initials
    const cand = b.candidate;
    const avatarImg = cand.avatar ? stateRef.current.avatarCache.get(cand.avatar) : null;

    if (avatarImg && avatarImg.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, -r * 0.62, -r * 0.62, r * 1.24, r * 1.24);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(13 * scale)}px "Prompt", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.fillText(b.initials, 0, 0);
    }

    // Name label badge
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    const textWidth = Math.min(r * 2.2, 54 * scale);
    ctx.roundRect(-textWidth / 2, r * 0.35, textWidth, 14 * scale, 6 * scale);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(8.5 * scale)}px "Prompt", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayShort = (cand.name || '').length > 6
      ? (cand.name || '').substring(0, 5) + '…'
      : (cand.name || '');
    ctx.fillText(displayShort, 0, r * 0.35 + 7 * scale);
    ctx.restore();

    // 3D Specular highlight shine (top-left glare)
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.4, r * 0.3, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw Realistic Scooper (กระชอนตักมีด้ามไม้และเอียงตามมุม)
  const drawScooper = (ctx, x, y, isCatching, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Scooper handle (ด้ามไม้)
    ctx.beginPath();
    ctx.moveTo(24, 16);
    ctx.lineTo(64, 52);
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Scooper handle metal tip
    ctx.beginPath();
    ctx.moveTo(24, 16);
    ctx.lineTo(34, 25);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Scooper wire ring (ขอบกระชอน)
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.strokeStyle = isCatching ? '#F59E0B' : '#E2E8F0';
    ctx.lineWidth = 3.8;
    ctx.fillStyle = isCatching ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.stroke();

    // Scooper mesh net lines (ตาข่ายละเอียด)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    for (let i = -22; i <= 22; i += 9) {
      ctx.beginPath();
      ctx.moveTo(i, -26);
      ctx.lineTo(i, 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-26, i);
      ctx.lineTo(26, i);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Mouse Move: Stirring water & velocity tracking
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || isLocked || stateRef.current.scoopedBall) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;
    const prevX = state.mouse.x;
    const prevY = state.mouse.y;
    const speed = Math.hypot(x - prevX, y - prevY);

    state.mouse = {
      x,
      y,
      prevX,
      prevY,
      isHover: true,
      speed
    };

    if (speed > 8 && y > 90) {
      sfx.playWaterStir(speed / 25);
    }
  };

  const handleMouseEnter = () => {
    stateRef.current.mouse.isHover = true;
  };

  const handleMouseLeave = () => {
    stateRef.current.mouse.isHover = false;
  };

  // Click: Scoop up a ball!
  const handleClick = (e) => {
    if (isLocked || stateRef.current.scoopedBall || candidates.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;

    // Pick candidate: closest ball to scooper or random
    let target = state.balls.find(b => Math.hypot(b.x - x, b.y - y) <= b.radius + 20);
    if (!target && state.balls.length > 0) {
      let closest = state.balls[0];
      let minDist = Infinity;
      for (const b of state.balls) {
        const d = Math.hypot(b.x - x, b.y - y);
        if (d < minDist) {
          minDist = d;
          closest = b;
        }
      }
      target = closest;
    }

    if (!target) return;

    // Trigger scoop!
    state.scoopedBall = target;
    state.scoopStartPos = { x: target.x, y: target.y };
    state.hasSplashedOnExit = false;
    state.liftProgress = 0;

    // Notify winner after complete realistic scooping sequence
    setTimeout(() => {
      if (onSelectWinner && target.candidate) {
        onSelectWinner(target.candidate);
      }
    }, 1750);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Interactive Canvas Water Tank */}
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

      {/* Guide Banner below tank (Transparent - No target preview) */}
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
        <span>🌀 เลื่อนเมาส์กวนน้ำวนไปมา</span>
        <span>•</span>
        <span>🥣 <strong>คลิกเพื่อช้อนตักลูกบอลลุ้นรางวัล!</strong></span>
      </div>
    </div>
  );
};

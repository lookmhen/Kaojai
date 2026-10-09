import React, { useRef, useEffect, useState } from 'react';
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
  width = 540,
  height = 420
}) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    balls: [],
    bubbles: [],
    splashes: [],
    waves: [],
    mouse: { x: -100, y: -100, prevX: -100, prevY: -100, isHover: false, speed: 0 },
    scoopedBall: null,
    liftProgress: 0,
    avatarCache: new Map()
  });

  const [hoveredCandidate, setHoveredCandidate] = useState(null);

  // Initialize waves and balls
  useEffect(() => {
    const state = stateRef.current;
    const waterLevel = 90;
    const numWaves = 32;

    // Wave points
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
        vAngle: (Math.random() - 0.5) * 0.05,
        isTarget: false
      };
    });

    state.scoopedBall = null;
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
      // Outer shadow & tank outline
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
      // Update wave points
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

        // Skip normal physics if this ball is being lifted up by scooper
        if (state.scoopedBall && state.scoopedBall.id === b.id) {
          continue;
        }

        // Buoyancy force (pulls towards water surface with slight bounce)
        const depth = b.y - waterLevel;
        if (depth > 20) {
          b.vy -= 0.14; // Floats upward
        } else if (depth < -5) {
          b.vy += 0.25; // Sinks back into water
        } else {
          // Bobbing oscillation
          b.vy += Math.sin(Date.now() * 0.003 + i) * 0.03;
        }

        // Water drag / resistance
        b.vx *= 0.965;
        b.vy *= 0.965;

        // Mouse Stirring interaction
        if (mouse.isHover && mouse.y > waterLevel - 20) {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const stirRadius = 75;

          if (dist < stirRadius && dist > 1) {
            const force = (1 - dist / stirRadius) * 2.2;
            b.vx += (dx / dist) * force + (mouse.speed * 0.12 * Math.sign(dx));
            b.vy += (dy / dist) * force + (mouse.speed * 0.08 * Math.sign(dy));
            b.vAngle += (Math.random() - 0.5) * 0.08;

            // Trigger water ripples
            const waveIdx = Math.floor((b.x / width) * state.waves.length);
            if (waveIdx >= 0 && waveIdx < state.waves.length) {
              state.waves[waveIdx].vy += force * 0.8;
            }
          }
        }

        // Apply velocity
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;
        b.vAngle *= 0.97;

        // Boundaries
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

        // Ball-to-ball soft collisions
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

              // Play gentle collision sound if substantial
              if (relVel > 1.2) {
                sfx.playBallClack();
              }
            }
          }
        }

        // Render standard floating ball
        drawBall(ctx, b, 1);
      }

      // --- 5. SCOOPER (กระชอนตัก) ---
      if (!isScooping && mouse.isHover) {
        drawScooper(ctx, mouse.x, mouse.y, false);
      }

      // --- 6. SCOOPED BALL LIFT ANIMATION ---
      if (state.scoopedBall) {
        state.liftProgress = Math.min(1, state.liftProgress + 0.025);
        const sb = state.scoopedBall;

        // Lift upwards to top center of tank
        const targetX = width / 2;
        const targetY = 70;
        const currentX = sb.x + (targetX - sb.x) * state.liftProgress;
        const currentY = sb.y + (targetY - sb.y) * state.liftProgress;

        // Scale up
        const scale = 1 + state.liftProgress * 1.25;

        // Golden aura
        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, currentY, sb.radius * scale + 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${state.liftProgress * 0.4})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(251, 191, 36, ${state.liftProgress * 0.8})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Scooper under the lifted ball
        drawScooper(ctx, currentX, currentY + 10, true);

        // Draw zoomed glowing ball
        drawBall(ctx, { ...sb, x: currentX, y: currentY }, scale);

        // Water droplets splash
        if (state.liftProgress < 0.6 && Math.random() < 0.6) {
          state.splashes.push({
            x: currentX + (Math.random() - 0.5) * 40,
            y: currentY + 20,
            vy: 2 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 2,
            radius: 2 + Math.random() * 3,
            life: 1
          });
        }
      }

      // Render splashing water droplets
      for (let i = state.splashes.length - 1; i >= 0; i--) {
        const s = state.splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.05;

        if (s.life <= 0) {
          state.splashes.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${s.life})`;
        ctx.fill();
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
      // 2-Letter Badge
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

  // Helper: Draw Scooper (กระชอน)
  const drawScooper = (ctx, x, y, isCatching) => {
    ctx.save();
    ctx.translate(x, y);

    // Scooper handle
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(58, 48);
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Scooper wire ring
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.strokeStyle = isCatching ? '#F59E0B' : '#E2E8F0';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = isCatching ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.stroke();

    // Scooper mesh net lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = -20; i <= 20; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, -24);
      ctx.lineTo(i, 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-24, i);
      ctx.lineTo(24, i);
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

    // Play dynamic water stirring sound
    if (speed > 8 && y > 90) {
      sfx.playWaterStir(speed / 25);
    }

    // Check hovered ball
    const hovered = state.balls.find(b => Math.hypot(b.x - x, b.y - y) <= b.radius + 10);
    setHoveredCandidate(hovered ? hovered.candidate : null);
  };

  const handleMouseEnter = () => {
    stateRef.current.mouse.isHover = true;
  };

  const handleMouseLeave = () => {
    stateRef.current.mouse.isHover = false;
    setHoveredCandidate(null);
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

    // Find ball closest to mouse, or pick random one near mouse
    let target = state.balls.find(b => Math.hypot(b.x - x, b.y - y) <= b.radius + 18);
    if (!target && state.balls.length > 0) {
      // If clicked anywhere in the water, pick the closest ball
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
    state.liftProgress = 0;

    // Splash sound
    sfx.playWaterSplash();

    // After lifting animation completes, notify winner
    setTimeout(() => {
      if (onSelectWinner && target.candidate) {
        onSelectWinner(target.candidate);
      }
    }, 1300);
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
          filter: 'drop-shadow(0 12px 28px rgba(3, 105, 161, 0.18))',
          touchAction: 'none'
        }}
      />

      {/* Guide Banner below tank */}
      <div
        style={{
          marginTop: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          color: '#0369A1',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 700
        }}
      >
        <span>🌀 เลื่อนเมาส์กวนน้ำวนไปมา</span>
        <span>•</span>
        <span>🥣 <strong>คลิกเพื่อช้อนตักลูกบอลผู้โชคดี!</strong></span>
        {hoveredCandidate && (
          <span style={{ color: '#EA580C', marginLeft: '6px' }}>
            🎯 กำลังเล็ง: <strong>{hoveredCandidate.name}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

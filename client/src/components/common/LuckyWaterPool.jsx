import React, { useRef, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';

const BALL_PALETTES = [
  { main: '#FF5E62', highlight: '#FFA8A8', rim: '#D9383D', text: '#FFFFFF' },
  { main: '#00C6FF', highlight: '#80E3FF', rim: '#0072FF', text: '#FFFFFF' },
  { main: '#10B981', highlight: '#6EE7B7', rim: '#047857', text: '#FFFFFF' },
  { main: '#F59E0B', highlight: '#FDE68A', rim: '#B45309', text: '#FFFFFF' },
  { main: '#8B5CF6', highlight: '#C4B5FD', rim: '#6D28D9', text: '#FFFFFF' },
  { main: '#EC4899', highlight: '#FBCFE8', rim: '#BE185D', text: '#FFFFFF' },
  { main: '#06B6D4', highlight: '#67E8F9', rim: '#0E7490', text: '#FFFFFF' },
  { main: '#F97316', highlight: '#FDBA74', rim: '#C2410C', text: '#FFFFFF' }
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
    ripples: [],
    mouse: { x: -100, y: -100, prevX: -100, prevY: -100, isHover: false, speed: 0 },
    scoopedBall: null,
    scoopStartPos: { x: 0, y: 0 },
    hasSplashedOnExit: false,
    liftProgress: 0,
    avatarCache: new Map()
  });

  // Tub & Water Geometry (2.5D Isometric Cylindrical Pool matching user sketch)
  const cx = width / 2;
  const topCy = 140;
  const rx = 246;
  const ry = 86;
  const tubHeight = 180;
  const botCy = topCy + tubHeight;

  // Recessed Water Surface inside the tub rim
  const waterCy = topCy + 14;
  const waterRx = rx - 12;
  const waterRy = ry - 8;

  // Initialize balls and avatars
  useEffect(() => {
    const state = stateRef.current;

    // Pre-cache avatar images if available
    candidates.forEach((c) => {
      if (c.avatar && !state.avatarCache.has(c.avatar)) {
        const img = new Image();
        img.src = `/avatars/${c.avatar}`;
        state.avatarCache.set(c.avatar, img);
      }
    });

    // Create balls positioned nicely inside the elliptical pool
    const ballBaseRadius = candidates.length > 32 ? 19 : (candidates.length > 16 ? 22 : 26);

    state.balls = candidates.map((cand, idx) => {
      const palette = BALL_PALETTES[idx % BALL_PALETTES.length];
      const nameStr = cand.name || 'Anonymous';
      const initials = nameStr.length > 2 ? nameStr.substring(0, 2) : nameStr;

      // Distribute randomly inside the water ellipse
      const angle = Math.random() * Math.PI * 2;
      const distRatio = 0.15 + Math.sqrt(Math.random()) * 0.72;
      const x = cx + Math.cos(angle) * (waterRx - ballBaseRadius - 10) * distRatio;
      const y = waterCy + Math.sin(angle) * (waterRy - ballBaseRadius - 6) * distRatio;

      return {
        id: cand.id || `ball_${idx}`,
        candidate: cand,
        x,
        y,
        baseY: y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.8,
        radius: ballBaseRadius,
        palette,
        initials,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.04,
        bobPhase: Math.random() * Math.PI * 2
      };
    });

    state.scoopedBall = null;
    state.hasSplashedOnExit = false;
    state.liftProgress = 0;
    state.ripples = [];
    state.splashes = [];
    state.drips = [];
    state.sparkles = [];
  }, [candidates, width, height, cx, waterCy, waterRx, waterRy]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // 1. SOFT FLOOR SHADOW BENEATH CYLINDER BASE
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, botCy + 14, rx * 0.95, ry * 0.48, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.filter = 'blur(10px)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

      // ==========================================
      // 2. CYLINDRICAL TUB OUTER WALL (ตัวถัง/อ่างน้ำทรงกระบอก)
      // ==========================================
      ctx.save();
      // Tub Wall Path: Left edge down, bottom arc, right edge up, top arc back
      ctx.beginPath();
      ctx.moveTo(cx - rx, topCy);
      ctx.lineTo(cx - rx, botCy);
      ctx.ellipse(cx, botCy, rx, ry, 0, 0, Math.PI, false); // Bottom front rim
      ctx.lineTo(cx + rx, topCy);
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI, true); // Top front curve
      ctx.closePath();

      // Tub Wall Gradient (3D cylindrical metallic/aquatic shading)
      const wallGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      wallGrad.addColorStop(0, '#0369A1');       // Dark left edge
      wallGrad.addColorStop(0.12, '#38BDF8');    // Specular cylinder highlight
      wallGrad.addColorStop(0.35, '#0284C7');    // Mid tone
      wallGrad.addColorStop(0.75, '#0369A1');    // Rich blue body
      wallGrad.addColorStop(1, '#075985');       // Shadow right edge
      ctx.fillStyle = wallGrad;
      ctx.fill();

      // Decorative Tub Metallic Bands / Barrel Ribs (ห่วงคาดถังน้ำ 2 เส้น)
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
      ctx.ellipse(cx, botCy, rx, ry, 0, 0, Math.PI, false);
      ctx.lineTo(cx + rx, topCy);
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 3. TUB TOP RIM LIP & INNER BACK WALL (ขอบปากอ่างด้านใน)
      // ==========================================
      ctx.save();
      // Top Outer Rim
      ctx.beginPath();
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#075985'; // Deep inner cavity behind water
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Top Inner Lip Highlight
      ctx.beginPath();
      ctx.ellipse(cx, topCy - 1, rx - 3, ry - 3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 4. WATER SURFACE INSIDE THE TUB (ผิวน้ำในบ่อกลม)
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, waterCy, waterRx, waterRy, 0, 0, Math.PI * 2);

      // Translucent Aquatic Water Depth Gradient
      const waterGrad = ctx.createRadialGradient(cx, waterCy - 15, 10, cx, waterCy, waterRx);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
      waterGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.85)');
      waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.95)');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Inner water rim shadow/border
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // 5. WATER RIPPLES & WAVES (คลื่นน้ำวงรีสมจริง)
      // ==========================================
      // Spawn subtle ambient ripples occasionally
      if (Math.random() < 0.05 && state.ripples.length < 8) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.7;
        state.ripples.push({
          x: cx + Math.cos(ang) * (waterRx * dist),
          y: waterCy + Math.sin(ang) * (waterRy * dist),
          r: 2,
          maxR: 45 + Math.random() * 30,
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
        // Elliptical ripple matching perspective ratio
        const ryRatio = waterRy / waterRx;
        ctx.ellipse(rip.x, rip.y, rip.r, rip.r * ryRatio, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.75})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Air Bubbles floating inside the pool
      if (Math.random() < 0.22 && state.bubbles.length < 15) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.75;
        state.bubbles.push({
          x: cx + Math.cos(ang) * (waterRx * dist),
          y: waterCy + (Math.random() * 20 - 5),
          radius: 2 + Math.random() * 3.5,
          vy: -(0.3 + Math.random() * 0.7),
          vx: (Math.random() - 0.5) * 0.4,
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
      // 6. BALL PHYSICS & 2.5D ELLIPTICAL COLLISION
      // ==========================================
      const mouse = state.mouse;
      const isScooping = Boolean(state.scoopedBall);

      for (let i = 0; i < state.balls.length; i++) {
        const b = state.balls[i];

        // Skip normal physics if this ball is being scooped up by the Pickup Rod
        if (state.scoopedBall && state.scoopedBall.id === b.id) {
          continue;
        }

        // Water resistance & friction
        b.vx *= 0.965;
        b.vy *= 0.965;

        // Gentle floating bobbing on elliptical water plane
        b.bobPhase += 0.035;
        b.y += Math.sin(b.bobPhase) * 0.15;

        // Mouse Pickup Rod Stirring Interaction (กวนน้ำวน)
        if (mouse.isHover) {
          const dx = b.x - mouse.x;
          const dy = b.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const stirRadius = 78;

          if (dist < stirRadius && dist > 1) {
            const force = (1 - dist / stirRadius) * 2.2;
            b.vx += (dx / dist) * force + (mouse.speed * 0.08 * Math.sign(dx));
            b.vy += (dy / dist) * force + (mouse.speed * 0.06 * Math.sign(dy));
            b.vAngle += (Math.random() - 0.5) * 0.06;

            // Trigger ripple when rod stirs water
            if (Math.random() < 0.15) {
              state.ripples.push({
                x: mouse.x,
                y: mouse.y,
                r: 3,
                maxR: 42,
                alpha: 0.6
              });
            }
          }
        }

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;
        b.vAngle *= 0.97;

        // Elliptical Boundary Collision (สะท้อนขอบอ่างวงรีตามมุมตกกระทบ)
        const effectiveRx = waterRx - b.radius - 4;
        const effectiveRy = waterRy - b.radius - 4;
        const normX = (b.x - cx) / effectiveRx;
        const normY = (b.y - waterCy) / effectiveRy;
        const normDist = Math.hypot(normX, normY);

        if (normDist > 1) {
          // Push ball back inside the ellipse
          b.x = cx + (normX / normDist) * effectiveRx;
          b.y = waterCy + (normY / normDist) * effectiveRy;

          // Normal vector of the ellipse at this boundary point
          let nx = normX / (effectiveRx * effectiveRx);
          let ny = normY / (effectiveRy * effectiveRy);
          const nlen = Math.hypot(nx, ny) || 1;
          nx /= nlen;
          ny /= nlen;

          const dot = b.vx * nx + b.vy * ny;
          if (dot > 0) {
            b.vx -= 1.6 * dot * nx;
            b.vy -= 1.6 * dot * ny;
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
            const overlap = (minDist - cdist) * 0.5;
            const cnx = cdx / cdist;
            const cny = cdy / cdist;

            b.x -= cnx * overlap;
            b.y -= cny * overlap;
            b2.x += cnx * overlap;
            b2.y += cny * overlap;

            const relVel = (b.vx - b2.vx) * cnx + (b.vy - b2.vy) * cny;
            if (relVel > 0) {
              const impulse = relVel * 0.85;
              b.vx -= impulse * cnx;
              b.vy -= impulse * cny;
              b2.vx += impulse * cnx;
              b2.vy += impulse * cny;

              if (relVel > 1.1) {
                sfx.playBallClack();
              }
            }
          }
        }
      }

      // ==========================================
      // 7. RENDER FLOATING BALLS WITH 2.5D PERSPECTIVE DEPTH
      // ==========================================
      // Sort balls by Y position so front balls cleanly overlap rear balls!
      const sortedBalls = [...state.balls].sort((a, b) => a.y - b.y);

      for (const b of sortedBalls) {
        if (state.scoopedBall && state.scoopedBall.id === b.id) continue;

        // Depth perspective scale: balls towards the back (top) are slightly smaller
        const depthY = (b.y - (waterCy - waterRy)) / (2 * waterRy);
        const depthScale = 0.88 + Math.max(0, Math.min(1, depthY)) * 0.24;

        drawBall(ctx, b, depthScale, state.avatarCache);
      }

      // Front Rim Lip Highlight (เส้นแสงไฮไลท์ผิวน้ำด้านหน้าอ่าง)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, waterCy, waterRx, waterRy, 0, 0, Math.PI, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
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
          // PHASE 1: Submerge & Lock On (หัว Pickup Rod ล็อคจับที่ลูกบอล)
          const p = t / 0.22;
          const dipY = Math.sin(p * Math.PI) * 12;
          currentX = start.x;
          currentY = start.y + dipY;
          scale = 1.0;
        } else if (t < 0.72) {
          // PHASE 2: Lifting Upwards through Water Surface (ยกช้อนขึ้นจากผิวน้ำ)
          const p = (t - 0.22) / 0.5;
          const ease = 1 - Math.pow(1 - p, 3);
          currentX = start.x + (targetX - start.x) * ease;
          currentY = start.y + (targetY - start.y) * ease;
          scale = 1 + ease * 0.45;

          // When passing through water surface:
          if (currentY <= waterCy + 10 && !state.hasSplashedOnExit) {
            state.hasSplashedOnExit = true;
            sfx.playWaterSplash();

            // Big splash droplets
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

            // Expanding ripple on water surface
            state.ripples.push({
              x: currentX,
              y: waterCy,
              r: 4,
              maxR: 90,
              alpha: 1
            });
          }
        } else {
          // PHASE 3: Floating High Above Tub (ลูกบอลลอยเด่นเหนือบ่อน้ำ พร้อมหยดน้ำติ๋งๆ และประกายระยิบระยับ)
          const p = (t - 0.72) / 0.28;
          currentX = targetX;
          currentY = targetY;
          scale = 1.45 + p * 0.45; // Scale up to 1.9x

          // Water drips falling back into tub
          if (Math.random() < 0.65) {
            state.drips.push({
              x: currentX + (Math.random() - 0.5) * 36,
              y: currentY + 30,
              vy: 2.5 + Math.random() * 2.5,
              radius: 1.5 + Math.random() * 2,
              life: 1
            });
          }

          // Wet sparkle glisten
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
          ctx.arc(currentX, currentY, sb.radius * scale + 15, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${auraProgress * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(251, 191, 36, ${auraProgress * 0.85})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Pickup Rod holding the ball
        drawPickupRod(ctx, currentX, currentY, true);

        // Draw the lifted ball
        drawBall(ctx, { ...sb, x: currentX, y: currentY }, scale, state.avatarCache);
      }

      // Render splashing water droplets
      for (let i = state.splashes.length - 1; i >= 0; i--) {
        const s = state.splashes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.18; // Gravity
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

      // Render water drips falling back into tub
      for (let i = state.drips.length - 1; i >= 0; i--) {
        const d = state.drips[i];
        d.y += d.vy;
        d.vy += 0.15; // Gravity acceleration

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

      // Render sparkling stars
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
  }, [width, height, cx, topCy, rx, ry, tubHeight, botCy, waterCy, waterRx, waterRy]);

  // Helper: Draw 3D Floating Ball with Avatar / Initials & Name
  const drawBall = (ctx, ball, scale = 1, avatarCache) => {
    const { x, y, radius, palette, initials, candidate: cand } = ball;
    const r = radius * scale;

    ctx.save();
    ctx.translate(x, y);

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    // 3. Avatar Icon or Initials
    const avatarImg = cand?.avatar ? avatarCache.get(cand.avatar) : null;
    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.52, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, -r * 0.52, -r * 0.15 - r * 0.52, r * 1.04, r * 1.04);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8 * scale;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(11 * scale)}px "Prompt", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 0, -r * 0.12);
    }

    // Candidate Short Name Badge
    ctx.save();
    const nameStr = cand.name || 'Anonymous';
    const displayShort = nameStr.length > 5 ? nameStr.substring(0, 4) + '…' : nameStr;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(8.5 * scale)}px "Prompt", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayShort, 0, r * 0.38 + 6 * scale);
    ctx.restore();

    // Specular Glare (Reflection shine on top-left)
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.38, r * 0.28, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw Pickup Rod matching the user's diagram
  // (คันเบ็ด/ไม้เกี่ยวสอยดาว พร้อมกล่อง Pickup Rod Head ที่ปลายไม้)
  const drawPickupRod = (ctx, tipX, tipY, isCatching) => {
    ctx.save();

    // Rod Pole parameters: comes from top-right down to tip
    const rodLength = 220;
    const angle = -Math.PI / 4; // 45 degrees
    const endX = tipX - Math.cos(angle) * rodLength;
    const endY = tipY - Math.sin(angle) * rodLength;

    // 1. ROD SHAFT (ด้ามคันเบ็ด/ไม้เกี่ยวสีดำเมทัลลิกคาดทอง)
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#1E293B'; // Dark metallic rod
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Inner Rod Highlight Line
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Golden Rod Guides / Accents (ปลอกทองเหลือง)
    const drawCollar = (ratio) => {
      const cx = tipX + (endX - tipX) * ratio;
      const cy = tipY + (endY - tipY) * ratio;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    drawCollar(0.18);
    drawCollar(0.48);
    drawCollar(0.78);

    // 2. PICKUP ROD HEAD (กล่องจับ/สอยลูกบอล ตรงตามรูปวาดเป๊ะๆ)
    const boxSize = 42;
    ctx.save();
    ctx.translate(tipX, tipY);

    // Shadow of the pickup box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-boxSize / 2 + 4, -boxSize / 2 + 6, boxSize, boxSize, 8);
    ctx.fill();

    // Pickup Box Body
    ctx.beginPath();
    ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 8);
    ctx.fillStyle = isCatching ? '#FEF3C7' : '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = isCatching ? '#F59E0B' : '#0284C7';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Target Crosshair / Claw Grid inside the box
    ctx.strokeStyle = isCatching ? '#F59E0B' : '#38BDF8';
    ctx.lineWidth = 1.6;
    // Inner square frame
    ctx.strokeRect(-boxSize / 2 + 7, -boxSize / 2 + 7, boxSize - 14, boxSize - 14);

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(-boxSize / 2 + 4, 0);
    ctx.lineTo(boxSize / 2 - 4, 0);
    ctx.moveTo(0, -boxSize / 2 + 4);
    ctx.lineTo(0, boxSize / 2 - 4);
    ctx.stroke();

    // Center Indicator Light (ไฟแสดงสถานะพร้อมล็อคเป้า)
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isCatching ? '#EF4444' : '#10B981'; // Green ready, Red locked!
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "PICKUP" label badge on top of box
    ctx.fillStyle = isCatching ? '#B45309' : '#0369A1';
    ctx.font = 'bold 7.5px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PICKUP', 0, -boxSize / 2 - 2);

    ctx.restore();
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

    // Check if inside elliptical water surface
    const normDist = Math.hypot((x - cx) / waterRx, (y - waterCy) / waterRy);
    if (speed > 8 && normDist <= 1.1) {
      sfx.playWaterStir(speed / 25);
    }
  };

  const handleMouseEnter = () => {
    stateRef.current.mouse.isHover = true;
  };

  const handleMouseLeave = () => {
    stateRef.current.mouse.isHover = false;
  };

  // Click: Scoop up / Pickup a ball with the Pickup Rod!
  const handleClick = (e) => {
    if (isLocked || stateRef.current.scoopedBall || candidates.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = stateRef.current;

    // Pick candidate: closest ball to Pickup Rod tip or random
    let target = state.balls.find((b) => Math.hypot(b.x - x, b.y - y) <= b.radius + 22);
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

    // Trigger scoop sequence with Pickup Rod!
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
      {/* Interactive 2.5D Cylindrical Tub Canvas */}
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

      {/* Guide Banner below tank (Transparent - Matching Pickup Rod style) */}
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
        <span>🎯 <strong>คลิกเพื่อสอยลูกบอลลุ้นรางวัล!</strong></span>
      </div>
    </div>
  );
};

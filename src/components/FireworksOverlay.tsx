import React, { useEffect, useRef } from 'react';
import { sounds } from '../lib/audio';
import { X } from 'lucide-react';

interface FireworksOverlayProps {
  durationMs?: number; // default 15000 (15s)
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  friction: number;
  size: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  exploded: boolean;
}

const FIREWORK_COLORS = [
  '#f59e0b', // Amber / Gold
  '#10b981', // Emerald Green
  '#3b82f6', // Sapphire Blue
  '#ec4899', // Hot Pink
  '#8b5cf6', // Violet Purple
  '#ef4444', // Crimson Red
  '#06b6d4', // Cyan
  '#facc15', // Neon Yellow
  '#f43f5e', // Rose
  '#ffffff', // Brilliant White
];

export const FireworksOverlay: React.FC<FireworksOverlayProps> = ({
  durationMs = 15000,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    sounds.playYahtzeeFanfare();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isRunning = true;
    const startTime = Date.now();

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createRocket = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = Math.random() * (w * 0.7) + w * 0.15;
      const targetY = Math.random() * (h * 0.45) + h * 0.1;
      const speed = Math.random() * 3 + 12;

      rockets.push({
        x,
        y: h,
        px: x,
        py: h,
        vx: (Math.random() - 0.5) * 2,
        vy: -speed,
        targetY,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        exploded: false,
      });

      sounds.playFireworkWhistleSound();
    };

    const explodeRocket = (rocket: Rocket) => {
      sounds.playFireworkExplosionSound();

      const particleCount = Math.floor(Math.random() * 50) + 70;
      const baseColor = rocket.color;
      const style = Math.floor(Math.random() * 3); // 0: standard, 1: ring, 2: chrysanthemum glitter

      for (let i = 0; i < particleCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 7 + 1.5;

        if (style === 1) {
          // Ring burst
          angle = (i / particleCount) * Math.PI * 2;
          speed = 5.5 + Math.random() * 0.8;
        }

        const color =
          Math.random() > 0.3
            ? baseColor
            : FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

        particles.push({
          x: rocket.x,
          y: rocket.y,
          px: rocket.x,
          py: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.018 + 0.012,
          gravity: 0.12,
          friction: 0.96,
          size: Math.random() * 2.5 + 1.5,
          flicker: Math.random() > 0.4,
        });
      }
    };

    // Initial burst of 4 rockets
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (isRunning) createRocket();
      }, i * 250);
    }

    // Launch schedule interval
    const launchInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < durationMs && isRunning) {
        createRocket();
        // Occasionally launch a twin rocket
        if (Math.random() > 0.5) {
          setTimeout(() => {
            if (isRunning) createRocket();
          }, 150);
        }
      }
    }, 550);

    // Main animation loop
    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Trail effect using destination-out
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Light glow blending for firework sparks
      ctx.globalCompositeOperation = 'lighter';

      // Update and render rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.px = r.x;
        r.py = r.y;

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.05; // slight deceleration

        // Draw rocket launch tail trail
        ctx.beginPath();
        ctx.moveTo(r.px, r.py);
        ctx.lineTo(r.x, r.y);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Rocket spark head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= -1) {
          r.exploded = true;
          explodeRocket(r);
          rockets.splice(i, 1);
        }
      }

      // Update and render explosion particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;

        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;

        p.x += p.vx;
        p.y += p.vy;

        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.flicker && Math.random() > 0.5 ? p.alpha * 0.4 : p.alpha;

        // Draw particle motion line
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs && rockets.length === 0 && particles.length === 0) {
        isRunning = false;
        clearInterval(launchInterval);
        if (onComplete) onComplete();
        return;
      }

      if (isRunning) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    const autoTimer = setTimeout(() => {
      isRunning = false;
      clearInterval(launchInterval);
      if (onComplete) onComplete();
    }, durationMs + 2000);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(launchInterval);
      clearTimeout(autoTimer);
      cancelAnimationFrame(animId);
    };
  }, [durationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Dismiss button */}
      <div className="relative z-10 flex justify-end pointer-events-auto">
        <button
          type="button"
          onClick={onComplete}
          className="bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs font-semibold backdrop-blur flex items-center gap-1.5 shadow-2xl transition-all active:scale-95 cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-amber-400" /> Skip Fireworks
        </button>
      </div>

      <div className="relative z-10 text-center pointer-events-none mb-6">
        <span className="inline-block bg-slate-900/90 text-amber-300 font-extrabold text-sm md:text-base px-5 py-2.5 rounded-full border border-amber-500/50 shadow-2xl backdrop-blur animate-bounce tracking-wide">
          🎆 Grand Victory Fireworks Show! 🎆
        </span>
      </div>
    </div>
  );
};

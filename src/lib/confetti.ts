import confetti from 'canvas-confetti';
import { sounds } from './audio';

export function triggerYahtzeeCelebration() {
  sounds.playYahtzeeFanfare();
  try {
    const duration = 15 * 1000; // 15 seconds fireworks
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    // Initial big burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15']
    });

    // 15-second fireworks interval
    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = Math.floor(40 * (timeLeft / duration)) + 10;

      // Burst from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.4), y: randomInRange(0.1, 0.5) },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15', '#38bdf8']
      });

      // Burst from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.9), y: randomInRange(0.1, 0.5) },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15', '#a855f7']
      });
    }, 400);
  } catch (err) {
    console.warn('Fireworks error:', err);
  }
}

import confetti from 'canvas-confetti';
import { sounds } from './audio';

export function triggerYahtzeeConfetti() {
  sounds.playYahtzeeFanfare();
  try {
    // Big central burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15'],
      zIndex: 1000,
    });

    // Side bursts following shortly after
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.65 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#facc15'],
        zIndex: 1000,
      });
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.65 },
        colors: ['#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15'],
        zIndex: 1000,
      });
    }, 250);
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}


import confetti from 'canvas-confetti';
import { sounds } from './audio';

export function triggerYahtzeeCelebration() {
  sounds.playYahtzeeFanfare();
  try {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444']
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 }
      });
    }, 200);
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

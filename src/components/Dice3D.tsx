import React from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, RotateCw, Star } from 'lucide-react';
import { sounds } from '../lib/audio';

interface Dice3DProps {
  dice: number[];
  held: boolean[];
  onToggleHold: (index: number) => void;
  onRoll: () => void;
  rollsLeft: number;
  isRolling: boolean;
  disabled?: boolean;
}

// Helper to generate a unique, random 2D shake trajectory for a die on each roll
function generateRandomDieAnimation(idx: number) {
  // Base horizontal direction bias (-2 to +2 index offset)
  const biasX = (idx - 2) * 6;
  
  // Dynamic random shake keyframes (x, y movement only, no stretching)
  const x1 = biasX + (Math.random() * 24 - 12);
  const x2 = -x1 * (0.8 + Math.random() * 0.4);
  const x3 = x1 * (0.6 + Math.random() * 0.3);
  const x4 = -x3 * (0.5 + Math.random() * 0.4);
  const x5 = (Math.random() * 6 - 3);

  const y1 = -(16 + Math.random() * 14);
  const y2 = 12 + Math.random() * 10;
  const y3 = -(10 + Math.random() * 8);
  const y4 = 6 + Math.random() * 6;
  const y5 = -(Math.random() * 4);

  // Subtle rotational shake jitter (±3 to ±6 deg)
  const rDirection = Math.random() > 0.5 ? 1 : -1;
  const r1 = rDirection * (3 + Math.random() * 3);
  const r2 = -r1 * 0.8;
  const r3 = r1 * 0.5;

  return {
    x: [0, x1, x2, x3, x4, x5, 0],
    y: [0, y1, y2, y3, y4, y5, 0],
    rotate: [0, r1, r2, r3, 0],
  };
}

// Render pips for dice values 1-6 or single star for wild (7)
const RenderPips: React.FC<{ value: number }> = ({ value }) => {
  if (value === 7) {
    return (
      <div className="w-10 h-10 flex items-center justify-center pointer-events-none">
        <Star className="w-7 h-7 text-amber-500 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] animate-pulse" />
      </div>
    );
  }

  const pipPositions: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
  };

  const positions = pipPositions[value] || [];

  return (
    <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 p-1 pointer-events-none">
      {positions.map((pos, i) => (
        <span
          key={i}
          className={`${pos} w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner place-self-center`}
        />
      ))}
    </div>
  );
};

export const Dice3D: React.FC<Dice3DProps> = ({
  dice,
  held,
  onToggleHold,
  onRoll,
  rollsLeft,
  isRolling,
  disabled = false
}) => {
  const [displayDice, setDisplayDice] = React.useState<number[]>(dice);
  const [activeAnimations, setActiveAnimations] = React.useState(() =>
    [0, 1, 2, 3, 4].map((i) => generateRandomDieAnimation(i))
  );

  // Keyboard shortcut listener: Space/Enter to roll, 1-5 to toggle hold
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled && rollsLeft > 0 && !isRolling) {
          sounds.playRollSound();
          onRoll();
        }
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (rollsLeft < 3 && rollsLeft >= 0 && !disabled && !isRolling && dice[idx] !== 7) {
          sounds.playClickSound();
          onToggleHold(idx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, rollsLeft, isRolling, onRoll, onToggleHold, dice]);

  React.useEffect(() => {
    if (isRolling) {
      setActiveAnimations([0, 1, 2, 3, 4].map((i) => generateRandomDieAnimation(i)));
      const interval = setInterval(() => {
        setDisplayDice((prev) =>
          prev.map((val, idx) => (held[idx] ? (dice[idx] || 1) : (Math.random() < 0.14 ? 7 : Math.floor(Math.random() * 6) + 1)))
        );
      }, 50);
      return () => clearInterval(interval);
    } else {
      setDisplayDice(dice);
    }
  }, [isRolling, dice, held]);

  return (
    <div id="dice-container" className="sticky top-4 z-30 flex flex-col items-center gap-6 p-6 bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-md w-full max-w-2xl">
      {/* Rolls left header */}
      <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">Roll Status</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
            {rollsLeft} / 3 Rolls Left
          </span>
        </div>

        <div className="flex gap-1.5">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                3 - rollsLeft >= num
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 5 Dice grid */}
      <div className="grid grid-cols-5 gap-3 sm:gap-4 my-2 w-full justify-items-center">
        {displayDice.map((value, idx) => {
          const isHeld = held[idx];
          const isWild = value === 7 || dice[idx] === 7;
          const dieAnim = activeAnimations[idx] || generateRandomDieAnimation(idx);

          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <motion.button
                id={`die-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  if (rollsLeft < 3 && rollsLeft >= 0 && !disabled && !isRolling && !isWild) {
                    sounds.playClickSound();
                    onToggleHold(idx);
                  }
                }}
                disabled={disabled || rollsLeft === 3 || isRolling || isWild}
                animate={
                  isRolling && !isHeld
                    ? {
                        x: dieAnim.x,
                        y: dieAnim.y,
                        rotate: dieAnim.rotate
                      }
                    : { x: 0, y: 0, rotate: 0 }
                }
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut'
                }}
                whileHover={{ scale: disabled || rollsLeft === 3 || isWild ? 1 : 1.05 }}
                whileTap={{ scale: disabled || rollsLeft === 3 || isWild ? 1 : 0.95 }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 select-none cursor-pointer ${
                  isWild
                    ? 'bg-amber-100 ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] translate-y-[-4px]'
                    : isHeld
                    ? 'bg-amber-100 ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] translate-y-[-4px]'
                    : 'bg-white hover:bg-slate-50 border-2 border-slate-200 shadow-lg'
                } ${disabled || rollsLeft === 3 ? 'opacity-80 cursor-default' : ''}`}
              >
                <RenderPips value={value} />

                {/* Held Badge */}
                {(isHeld || isWild) && (
                  <span className={`absolute -top-2 -right-2 ${isWild ? 'bg-amber-500 text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-bold'} text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md`}>
                    {isWild ? <Star className="w-2.5 h-2.5 fill-slate-950 stroke-none" /> : <Lock className="w-2.5 h-2.5 stroke-[3]" />}
                    {isWild ? 'WILD' : 'HELD'}
                  </span>
                )}
              </motion.button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  if (rollsLeft < 3 && !disabled && !isRolling && !isWild) {
                    sounds.playClickSound();
                    onToggleHold(idx);
                  }
                }}
                disabled={disabled || rollsLeft === 3 || isRolling || isWild}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                  isWild
                    ? 'text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 cursor-not-allowed'
                    : isHeld
                    ? 'text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                } ${disabled || rollsLeft === 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {isWild ? <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> : isHeld ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                {isWild ? 'Wild Star' : isHeld ? 'Held' : 'Hold'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Roll Action Button */}
      <motion.button
        id="roll-dice-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled && rollsLeft > 0 && !isRolling) {
            sounds.playRollSound();
            onRoll();
          }
        }}
        disabled={disabled || rollsLeft === 0 || isRolling}
        whileHover={{ scale: disabled || rollsLeft === 0 || isRolling ? 1 : 1.02 }}
        whileTap={{ scale: disabled || rollsLeft === 0 || isRolling ? 1 : 0.98 }}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl ${
          rollsLeft === 0 || disabled
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
        }`}
      >
        <RotateCw className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
        {isRolling
          ? 'Rolling Dice...'
          : rollsLeft === 3
          ? 'Roll 5 Dice to Start Turn'
          : rollsLeft > 0
          ? `Roll Unheld Dice (${rollsLeft} left)`
          : 'Select a Box on Scorecard'}
      </motion.button>
    </div>
  );
};

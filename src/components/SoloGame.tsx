import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { CategoryKey, ScoreCard } from '../types/yahtzee';
import { calculateCategoryScore, updateScoreCardTotals, isScoreCardFinished, isYahtzee } from '../lib/yahtzeeLogic';
import { Dice3D } from './Dice3D';
import { ScoreBoard } from './ScoreBoard';
import { FireworksOverlay } from './FireworksOverlay';
import { sounds } from '../lib/audio';
import { Trophy, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';

interface SoloGameProps {
  user: User | null;
  guestName: string;
  onOpenAuthModal: () => void;
}

export const SoloGame: React.FC<SoloGameProps> = ({ user, guestName, onOpenAuthModal }) => {
  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [scoreCard, setScoreCard] = useState<ScoreCard>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const [savedToLeaderboard, setSavedToLeaderboard] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Roll dice handler
  const handleRoll = () => {
    if (rollsLeft <= 0 || isRolling || isFinished) return;

    setIsRolling(true);
    setTimeout(() => {
      const nextDice = dice.map((val, idx) => {
        if (held[idx] && rollsLeft < 3) return val;
        return Math.random() < 0.12 ? 7 : Math.floor(Math.random() * 6) + 1;
      });

      const nextHeld = held.map((h, idx) => h || nextDice[idx] === 7);

      setDice(nextDice);
      setHeld(nextHeld);
      setRollsLeft((prev) => prev - 1);
      setIsRolling(false);

      if (isYahtzee(nextDice)) {
        sounds.playYahtzeeFanfare();
      }
    }, 600);
  };

  // Toggle hold handler
  const handleToggleHold = (idx: number) => {
    if (rollsLeft === 3 || isRolling || isFinished) return;
    if (dice[idx] === 7) return;
    setHeld((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  // Select score category handler
  const handleSelectCategory = async (category: CategoryKey) => {
    if (rollsLeft === 3 || isFinished) return;

    const points = calculateCategoryScore(category, dice, scoreCard);

    // Check Yahtzee Bonus
    let nextYahtzeeBonus = scoreCard.yahtzeeBonusCount || 0;
    const isYahtzeeRoll = isYahtzee(dice);
    if (isYahtzeeRoll && scoreCard.yahtzee === 50 && category !== 'yahtzee') {
      nextYahtzeeBonus++;
    }

    const nextCard: ScoreCard = {
      ...scoreCard,
      [category]: points,
      yahtzeeBonusCount: nextYahtzeeBonus
    };

    const updatedCard = updateScoreCardTotals(nextCard);
    setScoreCard(updatedCard);

    // Reset turn state
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);

    // Check if game is complete (all 13 categories filled)
    if (isScoreCardFinished(updatedCard)) {
      setIsFinished(true);
      setShowFireworks(true);

      // Auto save to Firestore leaderboard
      await saveScoreToLeaderboard(updatedCard.grandTotal || 0);
    }
  };

  // Save final score to Firestore
  const saveScoreToLeaderboard = async (finalScore: number) => {
    try {
      setIsSaving(true);
      const entryName = user ? (user.displayName || 'Player') : guestName;
      const entryPhoto = user?.photoURL || '';
      const userId = user?.uid || `guest_${Date.now()}`;

      await addDoc(collection(db, 'highScores'), {
        userId,
        userName: entryName,
        userPhoto: entryPhoto,
        score: finalScore,
        mode: 'solo',
        createdAt: new Date().toISOString()
      });

      setSavedToLeaderboard(true);
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset for new game
  const handleNewGame = () => {
    sounds.playClickSound();
    setDice([1, 2, 3, 4, 5]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setIsRolling(false);
    setScoreCard({});
    setIsFinished(false);
    setShowFireworks(false);
    setSavedToLeaderboard(false);
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-6xl mx-auto px-4 py-6">
      {/* Game Complete Banner */}
      {isFinished && (
        <div className="w-full bg-gradient-to-r from-emerald-900/90 via-slate-900 to-amber-900/90 border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                Game Over! Final Score: <span className="text-amber-400 font-mono">{scoreCard.grandTotal}</span>
              </h2>
              <p className="text-xs text-slate-300">
                {savedToLeaderboard
                  ? 'Your score has been recorded on the global leaderboard!'
                  : isSaving
                  ? 'Saving score to global leaderboard...'
                  : 'Score registered.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedToLeaderboard && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                <CheckCircle className="w-4 h-4" /> Submitted to Leaderboard
              </span>
            )}

            <button
              type="button"
              onClick={handleNewGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Play Again
            </button>
          </div>
        </div>
      )}

      {/* Sticky Roll Box */}
      <div className="sticky top-2 z-30 w-full flex justify-center">
        <Dice3D
          dice={dice}
          held={held}
          onToggleHold={handleToggleHold}
          onRoll={handleRoll}
          rollsLeft={rollsLeft}
          isRolling={isRolling}
          disabled={isFinished}
        />
      </div>

      {/* Scorecard & Tips - Scrolls underneath roll box */}
      <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="w-full max-w-md mx-auto flex justify-center">
          <ScoreBoard
            scoreCard={scoreCard}
            dice={dice}
            rollsLeft={rollsLeft}
            onSelectCategory={handleSelectCategory}
            isMyTurn={!isFinished}
            disabled={isFinished}
            playerName={user ? user.displayName || 'Player' : guestName}
          />
        </div>

        {/* Quick tips card */}
        <div className="w-full lg:max-w-xs flex flex-col gap-4">
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-400 text-xs flex flex-col gap-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <b>Pro Tip:</b> Get at least 63 points in the Upper Section to unlock the +35 Upper Bonus!
              </span>
            </div>

            <button
              type="button"
              onClick={handleNewGame}
              className="text-slate-400 hover:text-slate-100 underline text-xs self-start"
            >
              Restart Solo Game
            </button>
          </div>
        </div>
      </div>

      {showFireworks && (
        <FireworksOverlay durationMs={15000} onComplete={() => setShowFireworks(false)} />
      )}
    </div>
  );
};

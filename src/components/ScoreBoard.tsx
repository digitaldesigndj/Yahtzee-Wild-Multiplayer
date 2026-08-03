import React from 'react';
import { CategoryKey, ScoreCard } from '../types/yahtzee';
import { CATEGORY_LABELS, calculateCategoryScore } from '../lib/yahtzeeLogic';
import { sounds } from '../lib/audio';
import { CheckCircle2, Award, Sparkles } from 'lucide-react';

interface ScoreBoardProps {
  scoreCard: ScoreCard;
  dice: number[];
  rollsLeft: number;
  onSelectCategory: (cat: CategoryKey) => void;
  isMyTurn?: boolean;
  disabled?: boolean;
  playerName?: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  scoreCard,
  dice,
  rollsLeft,
  onSelectCategory,
  isMyTurn = true,
  disabled = false,
  playerName
}) => {
  const upperCategories: CategoryKey[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const lowerCategories: CategoryKey[] = [
    'threeOfAKind',
    'fourOfAKind',
    'fullHouse',
    'smallStraight',
    'largeStraight',
    'yahtzee',
    'chance'
  ];

  const hasRolled = rollsLeft < 3;
  const upperSubtotal = scoreCard.upperSubtotal || 0;
  const upperBonus = scoreCard.upperBonus || 0;
  const pointsToBonus = Math.max(0, 63 - upperSubtotal);

  const renderCategoryRow = (cat: CategoryKey) => {
    const isScored = typeof scoreCard[cat] === 'number';
    const scoreVal = scoreCard[cat];
    const potentialScore = hasRolled ? calculateCategoryScore(cat, dice, scoreCard) : 0;

    const isSelectable = isMyTurn && !disabled && !isScored && hasRolled;

    return (
      <tr
        key={cat}
        onClick={() => {
          if (isSelectable) {
            sounds.playScoreSound();
            onSelectCategory(cat);
          }
        }}
        className={`border-b border-slate-800/60 transition-colors ${
          isSelectable
            ? 'hover:bg-emerald-900/30 cursor-pointer group'
            : isScored
            ? 'bg-slate-900/40 text-slate-300'
            : 'text-slate-500'
        }`}
      >
        <td className="py-2.5 px-3 font-medium text-xs sm:text-sm">
          <div className="flex flex-col">
            <span className={`font-semibold ${isScored ? 'text-slate-200' : isSelectable ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-slate-400'}`}>
              {CATEGORY_LABELS[cat].name}
            </span>
            <span className="text-[10px] text-slate-500">{CATEGORY_LABELS[cat].desc}</span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right font-bold text-sm sm:text-base">
          {isScored ? (
            <span className="inline-flex items-center gap-1 text-amber-400">
              {scoreVal}
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
            </span>
          ) : isSelectable ? (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold transition-all ${
              potentialScore > 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:bg-emerald-500 group-hover:text-slate-950'
                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
            }`}>
              +{potentialScore}
            </span>
          ) : (
            <span className="text-slate-600">-</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md w-full max-w-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            {playerName ? `${playerName}'s Scorecard` : 'Official Scorecard'}
          </h3>
          <p className="text-xs text-slate-400">Select an open box to log your score</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Score</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{scoreCard.grandTotal || 0}</div>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <th className="py-2 px-3">Upper Section</th>
              <th className="py-2 px-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {upperCategories.map(renderCategoryRow)}

            {/* Upper Subtotal & Bonus */}
            <tr className="bg-slate-950/60 border-t border-slate-700/80">
              <td className="py-2 px-3 text-xs font-semibold text-slate-300">Upper Subtotal</td>
              <td className="py-2 px-3 text-right font-bold text-slate-200 text-xs sm:text-sm font-mono">{upperSubtotal} / 63</td>
            </tr>
            <tr className="bg-slate-950/60 border-b border-slate-700">
              <td className="py-2 px-3 text-xs font-semibold text-amber-300">
                Upper Bonus (+35 pts)
                {upperBonus === 0 && pointsToBonus > 0 && (
                  <span className="block text-[10px] text-slate-400 font-normal">Need {pointsToBonus} more pts</span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-bold text-amber-400 text-xs sm:text-sm font-mono">
                {upperBonus > 0 ? '+35' : '0'}
              </td>
            </tr>

            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <th className="py-2.5 px-3 pt-4">Lower Section</th>
              <th className="py-2.5 px-3 text-right pt-4">Points</th>
            </tr>
            {lowerCategories.map(renderCategoryRow)}

            {/* Yahtzee Bonus Count */}
            {(scoreCard.yahtzeeBonusCount || 0) > 0 && (
              <tr className="bg-amber-950/30 border-t border-amber-500/30">
                <td className="py-2 px-3 text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
                  Bonus Yahtzee ({scoreCard.yahtzeeBonusCount}x)
                </td>
                <td className="py-2 px-3 text-right font-bold text-amber-400 text-xs sm:text-sm font-mono">
                  +{(scoreCard.yahtzeeBonusCount || 0) * 100}
                </td>
              </tr>
            )}

            {/* Grand Total Footer */}
            <tr className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border-t-2 border-emerald-500/50">
              <td className="py-3 px-3 text-sm font-black text-emerald-400 uppercase tracking-wider">Grand Total</td>
              <td className="py-3 px-3 text-right text-xl font-black text-amber-400 font-mono">
                {scoreCard.grandTotal || 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

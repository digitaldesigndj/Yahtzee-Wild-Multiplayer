import React from 'react';
import { CATEGORY_LABELS } from '../lib/yahtzeeLogic';
import { HelpCircle, Sparkles, Award, Dices, RotateCcw, CheckCircle2 } from 'lucide-react';

export const HowToPlay: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 py-6 text-slate-200">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
          <HelpCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wider">
            How to Play Yahtzee
          </h2>
          <p className="text-xs text-slate-400">
            Learn the rules, upper section bonuses, straight sequences, and Yahtzee scoring strategies.
          </p>
        </div>
      </div>

      {/* Mechanics Single Column */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold">
            <Dices className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">1. Roll & Hold</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each turn has up to 3 rolls. Click dice to Hold/Lock them between rolls to build your desired combination.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">2. Select Score Box</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select 1 open category on your scorecard each turn. Each of the 13 categories can only be scored once per game!
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">3. Upper Bonus & Yahtzee</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Score 63+ in Upper Section to get a +35 bonus. Roll 5 of a kind for a 50pt Yahtzee (and +100 for bonus Yahtzees)!
          </p>
        </div>
      </div>

      {/* Bonus Yahtzee & Joker Rules Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Bonus Yahtzee & Joker Rules</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Rolling more than one Yahtzee in a game unlocks massive bonus points and flexible scoring!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/20 flex flex-col gap-1">
            <span className="font-bold text-amber-300">★ +100 Point Bonus</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If you roll a 5-of-a-kind AFTER already scoring 50 points in your Yahtzee box, you automatically receive a <b>+100 point Bonus Yahtzee</b> for every additional Yahtzee!
            </p>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/20 flex flex-col gap-1">
            <span className="font-bold text-amber-300">🃏 Joker Rule Scoring</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When scoring a Bonus Yahtzee, you can use it in any open category box. If placed in Full House, Small Straight, or Large Straight, you automatically receive full points (25, 30, or 40 pts)!
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Complete Category Reference
        </h3>

        <div className="flex flex-col gap-4">
          {/* Upper section */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-black uppercase text-emerald-400 border-b border-slate-800 pb-2">
              Upper Section (Ones - Sixes)
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• <b>Ones through Sixes:</b> Sum of only dice matching that number.</li>
              <li>• <b>Upper Bonus (+35 pts):</b> Awarded if the sum of Upper Section items equals or exceeds 63.</li>
            </ul>
          </div>

          {/* Lower section */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-black uppercase text-amber-400 border-b border-slate-800 pb-2">
              Lower Section (Combos)
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• <b>3 of a Kind:</b> 3+ matching dice. Scores total sum of all 5 dice.</li>
              <li>• <b>4 of a Kind:</b> 4+ matching dice. Scores total sum of all 5 dice.</li>
              <li>• <b>Full House (25 pts):</b> 3 of one kind + 2 of another.</li>
              <li>• <b>Small Straight (30 pts):</b> Sequence of 4 dice (e.g., 1-2-3-4 or 3-4-5-6).</li>
              <li>• <b>Large Straight (40 pts):</b> Sequence of 5 dice (e.g., 1-2-3-4-5).</li>
              <li>• <b>Yahtzee (50 pts):</b> All 5 dice matching!</li>
              <li>• <b>Chance:</b> Sum of all 5 dice, no combination required.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

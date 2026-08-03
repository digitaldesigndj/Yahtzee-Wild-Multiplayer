import React from 'react';
import { Trophy, RefreshCw, X, CheckCircle, Award, Star, Eye } from 'lucide-react';
import { ScoreCard } from '../types/yahtzee';

interface PlayerStanding {
  id: string;
  name: string;
  score: number;
  upperBonus?: number;
  isWinner?: boolean;
  isMe?: boolean;
}

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  mode: 'solo' | 'multiplayer';
  playerName?: string;
  scoreCard?: ScoreCard;
  playersStandings?: PlayerStanding[];
  winnerName?: string;
  savedToLeaderboard?: boolean;
  isSavingLeaderboard?: boolean;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  title,
  mode,
  playerName = 'Player',
  scoreCard,
  playersStandings = [],
  winnerName,
  savedToLeaderboard,
  isSavingLeaderboard,
  onPlayAgain,
  onReplayFireworks,
}) => {
  if (!isOpen) return null;

  const grandTotal = scoreCard?.grandTotal || 0;
  const upperTotal = scoreCard?.upperTotal || 0;
  const lowerTotal = scoreCard?.lowerTotal || 0;
  const upperBonus = scoreCard?.upperBonus || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 flex flex-col items-center gap-6 text-center animate-scale-up overflow-hidden">
        
        {/* Background glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Close window to review scorecard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/20 animate-pulse">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-md">
            <Star className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
            {mode === 'solo' ? 'Game Finished' : 'Match Concluded'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {title || (mode === 'solo' ? `${playerName}'s Final Score` : `${winnerName || 'Winner'} Wins!`)}
          </h2>
        </div>

        {/* Mode Specific Score Summary */}
        {mode === 'solo' ? (
          <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total Score</span>
              <span className="text-5xl font-black font-mono text-amber-400 mt-1 tracking-tight drop-shadow-md">
                {grandTotal} <span className="text-lg text-slate-400 font-sans font-normal">pts</span>
              </span>
            </div>

            {/* Score Breakdown Pills */}
            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Upper</span>
                <span className="text-sm font-mono font-bold text-slate-200">{upperTotal}</span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Upper Bonus</span>
                <span className={`text-sm font-mono font-bold ${upperBonus > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  +{upperBonus}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Lower</span>
                <span className="text-sm font-mono font-bold text-slate-200">{lowerTotal}</span>
              </div>
            </div>

            {/* Leaderboard status */}
            {(savedToLeaderboard || isSavingLeaderboard) && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl w-full justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {savedToLeaderboard
                    ? 'Saved to global leaderboard!'
                    : 'Saving to global leaderboard...'}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Multiplayer Standings Table */
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden text-left">
            <div className="bg-slate-900/90 px-4 py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Final Standings</span>
              <span className="text-[10px] text-slate-500 font-normal">Ranked by score</span>
            </div>
            <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto no-scrollbar">
              {playersStandings.map((player, idx) => (
                <div
                  key={player.id}
                  className={`px-4 py-3 flex items-center justify-between text-sm transition-colors ${
                    player.isWinner ? 'bg-amber-500/10' : player.isMe ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-slate-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{player.name}</span>
                        {player.isMe && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                            You
                          </span>
                        )}
                        {player.isWinner && (
                          <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                      {player.upperBonus ? (
                        <p className="text-[10px] text-emerald-400 font-medium">+35 Upper Bonus</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-base">
                    {player.score} <span className="text-xs text-slate-500 font-normal">pts</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            Review Board
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            {mode === 'solo' ? 'Play Again' : 'Return to Lobbies'}
          </button>
        </div>

      </div>
    </div>
  );
};

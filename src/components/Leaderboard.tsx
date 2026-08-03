import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HighScoreEntry } from '../types/yahtzee';
import { Trophy, Medal, Crown, Calendar, User, Sparkles, Dices, Star } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [scores, setScores] = useState<HighScoreEntry[]>([]);
  const [modeFilter, setModeFilter] = useState<'all' | 'solo' | 'multiplayer'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, 'highScores'),
      orderBy('score', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: HighScoreEntry[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as HighScoreEntry);
      });
      setScores(list);
      setIsLoading(false);
    }, (err) => {
      console.error('Leaderboard error:', err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredScores = scores.filter((item) => {
    if (modeFilter === 'all') return true;
    return item.mode === modeFilter;
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg flex-shrink-0">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Global Leaderboard
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300">
              Top Yahtzee players ranked by highest score
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
          {(['all', 'solo', 'multiplayer'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeFilter(m)}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold capitalize transition-all ${
                modeFilter === m
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-6 shadow-xl">
        {isLoading ? (
          <div className="py-12 sm:py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Fetching Leaderboard Scores...</span>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 flex flex-col items-center gap-2">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 opacity-30 stroke-1" />
            <p className="text-xs sm:text-sm">No scores submitted for this filter yet.</p>
            <p className="text-[11px] sm:text-xs">Play a game of Yahtzee to claim rank #1!</p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-10 sm:w-16">Rank</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4">Player</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center">Wilds</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center">Yahtzees</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 hidden sm:table-cell">Mode</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 hidden sm:table-cell">Date</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredScores.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={entry.id || idx}
                      className={`transition-colors ${
                        rank === 1
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : rank === 2
                          ? 'bg-slate-800/30 hover:bg-slate-800/50'
                          : rank === 3
                          ? 'bg-orange-950/20 hover:bg-orange-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4">
                        <div className="flex items-center font-black text-xs sm:text-sm">
                          {rank === 1 ? (
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] sm:text-xs shadow-md">
                              🥇
                            </span>
                          ) : rank === 2 ? (
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center text-[10px] sm:text-xs shadow-md">
                              🥈
                            </span>
                          ) : rank === 3 ? (
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] sm:text-xs shadow-md">
                              🥉
                            </span>
                          ) : (
                            <span className="w-6 sm:w-7 text-center text-slate-400 font-mono text-[11px] sm:text-xs">
                              #{rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Player Avatar & Name (+ Mode tag on mobile) */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {entry.userPhoto ? (
                            <img
                              src={entry.userPhoto}
                              alt={entry.userName}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px] sm:text-xs flex-shrink-0">
                              {entry.userName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                            <span className={`font-bold text-xs sm:text-sm truncate max-w-[110px] sm:max-w-none ${isTop3 ? 'text-slate-100' : 'text-slate-300'}`}>
                              {entry.userName}
                            </span>
                            <span className={`sm:hidden inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider w-fit border ${
                              entry.mode === 'multiplayer'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {entry.mode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Wild Dice Rolled */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/40 dark:border-emerald-500/20 px-2.5 py-1 rounded-md shadow-sm">
                          <Dices className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                          {entry.wildDiceCount ?? 0}
                        </span>
                      </td>

                      {/* Yahtzees Scored */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1 font-mono font-bold text-xs text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          {entry.yahtzeesCount ?? 0}
                        </span>
                      </td>

                      {/* Mode (Desktop) */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 hidden sm:table-cell">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          entry.mode === 'multiplayer'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {entry.mode}
                        </span>
                      </td>

                      {/* Date (Desktop) */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-xs text-slate-400 font-mono hidden sm:table-cell">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-right">
                        <span className="text-sm sm:text-lg font-black text-amber-400 font-mono">
                          {entry.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

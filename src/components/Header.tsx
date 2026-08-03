import React from 'react';
import { User } from 'firebase/auth';
import { ActiveTab } from '../types/yahtzee';
import { sounds } from '../lib/audio';
import { Dices, Trophy, Users, HelpCircle, Volume2, VolumeX, LogIn, LogOut, User as UserIcon, Pencil } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User | null;
  guestName: string;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  guestName,
  onOpenAuthModal,
  onSignOut,
  soundEnabled,
  setSoundEnabled
}) => {
  return (
    <header id="main-header" className="w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Top bar on mobile: Logo on left, Controls on right */}
        <div className="w-full md:w-auto flex items-center justify-between gap-2">
          {/* Brand logo */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('solo')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-black tracking-wider text-slate-100 uppercase flex items-center gap-1">
                YAHTZEE <span className="text-emerald-400 font-extrabold">WILD</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Real-Time Multiplayer & Leaderboard</p>
            </div>
          </div>

          {/* Right Controls for Mobile */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                sounds.enabled = next;
                setSoundEnabled(next);
              }}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Auth button / Avatar */}
            {user ? (
              <div
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-lg object-cover border border-emerald-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Auth
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="w-full md:w-auto max-w-full overflow-x-auto no-scrollbar flex items-center justify-start sm:justify-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => { sounds.playClickSound(); setActiveTab('solo'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'solo'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            Solo Game
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClickSound(); setActiveTab('multiplayer'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative shrink-0 whitespace-nowrap ${
              activeTab === 'multiplayer'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Multiplayer
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClickSound(); setActiveTab('leaderboard'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClickSound(); setActiveTab('rules'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Rules
          </button>
        </nav>

        {/* Right Controls for Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              sounds.enabled = next;
              setSoundEnabled(next);
            }}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Auth Profile */}
          {user ? (
            <div
              onClick={onOpenAuthModal}
              title="Click to configure player name"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-1 pr-2 cursor-pointer transition-all group"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate group-hover:text-emerald-400 transition-colors">
                  {user.displayName || 'Player'}
                </span>
                <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                  Auth <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-400" />
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOut();
                }}
                title="Sign Out"
                className="ml-1 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In / Auth
              </button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <UserIcon className="w-3 h-3 text-amber-400" />
                <span>Guest: <b>{guestName}</b></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


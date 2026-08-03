import React, { useState, useEffect } from 'react';
import { signInWithPopup, updateProfile, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { X, UserCheck, ShieldAlert, Sparkles, User as UserIcon, Pencil, CheckCircle2, LogOut } from 'lucide-react';
import { sounds } from '../lib/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  guestName: string;
  setGuestName: (name: string) => void;
  onUserUpdated?: () => void;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  guestName,
  setGuestName,
  onUserUpdated,
  onSignOut
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState(guestName);
  const [tempDisplayName, setTempDisplayName] = useState(user?.displayName || '');

  useEffect(() => {
    if (user) {
      setTempDisplayName(user.displayName || '');
      setSuccessMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      await signInWithPopup(auth, googleProvider);
      sounds.playScoreSound();
      onClose();
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in popup was closed before completing.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Pop-up was blocked by browser. Please allow popups or open in a new tab.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tempDisplayName.trim()) return;
    try {
      setIsUpdatingName(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await updateProfile(user, { displayName: tempDisplayName.trim() });
      sounds.playScoreSound();
      setSuccessMsg('Player name updated successfully!');
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err: unknown) {
      console.error('Failed to update name:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSaveGuestName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempGuestName.trim()) {
      setGuestName(tempGuestName.trim());
      sounds.playClickSound();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Player Profile & Authentication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with Google to post verified scores on global leaderboards and host real-time multiplayer rooms.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Signed In View */}
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/30 flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-bold text-lg">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" /> Authenticated Player
                </div>
                <div className="text-base font-bold text-slate-100 truncate">{user.displayName || 'Player'}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>

            {/* Configurable Player Name Form for Logged In Player */}
            <form onSubmit={handleSaveDisplayName} className="flex flex-col gap-2.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                Configure Player Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempDisplayName}
                  onChange={(e) => {
                    setTempDisplayName(e.target.value);
                    setSuccessMsg(null);
                  }}
                  placeholder="Enter player name"
                  maxLength={18}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingName || !tempDisplayName.trim() || tempDisplayName.trim() === user.displayName}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex-shrink-0"
                >
                  {isUpdatingName ? 'Saving...' : 'Save'}
                </button>
              </div>
              {successMsg && (
                <div className="text-emerald-400 text-xs flex items-center gap-1 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {successMsg}
                </div>
              )}
            </form>

            {/* Log Out Button */}
            <button
              type="button"
              onClick={async () => {
                sounds.playClickSound();
                try {
                  if (onSignOut) {
                    onSignOut();
                  } else {
                    await signOut(auth);
                  }
                } catch (err) {
                  console.error('Sign out error:', err);
                }
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Log Out of Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-neutral-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isSigningIn ? 'Connecting to Google OAuth...' : 'Sign In with Google'}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-500 uppercase">
                Or Continue as Guest
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Guest Profile Form */}
            <form onSubmit={handleSaveGuestName} className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Custom Guest Name
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={tempGuestName}
                    onChange={(e) => setTempGuestName(e.target.value)}
                    placeholder="Enter guest name"
                    maxLength={18}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

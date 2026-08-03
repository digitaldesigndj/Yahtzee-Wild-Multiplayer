/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { ActiveTab } from './types/yahtzee';
import { Header } from './components/Header';
import { SoloGame } from './components/SoloGame';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import { Leaderboard } from './components/Leaderboard';
import { HowToPlay } from './components/HowToPlay';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [guestName, setGuestName] = useState<string>('WildPlayer');
  const [activeTab, setActiveTab] = useState<ActiveTab>('solo');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Listen for Google Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'multiplayer') {
            setActiveGameId(null);
          }
        }}
        user={user}
        guestName={guestName}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col items-center pb-12">
        {activeTab === 'solo' && (
          <SoloGame
            user={user}
            guestName={guestName}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'multiplayer' && !activeGameId && (
          <MultiplayerLobby
            user={user}
            guestName={guestName}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onJoinGame={(gameId) => setActiveGameId(gameId)}
          />
        )}

        {activeTab === 'multiplayer' && activeGameId && (
          <MultiplayerGame
            gameId={activeGameId}
            user={user}
            guestName={guestName}
            onLeaveGame={() => setActiveGameId(null)}
          />
        )}

        {activeTab === 'leaderboard' && <Leaderboard />}

        {activeTab === 'rules' && <HowToPlay />}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <p>Yahtzee Wild - Vibe Coded by <a href="https://hyprtxt.dev">Taylor</a></p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        guestName={guestName}
        setGuestName={setGuestName}
        onUserUpdated={() => {
          if (auth.currentUser) {
            setUser({ ...auth.currentUser } as User);
          }
        }}
      />
    </div>
  );
}

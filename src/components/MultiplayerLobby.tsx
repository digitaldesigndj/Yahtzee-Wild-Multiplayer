import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { MultiplayerGameState, Player } from '../types/yahtzee';
import { getPlayerId } from '../lib/player';
import { sounds } from '../lib/audio';
import { Users, PlusCircle, LogIn, Crown, Radio, Sparkles, Clock } from 'lucide-react';

interface MultiplayerLobbyProps {
  user: User | null;
  guestName: string;
  onOpenAuthModal: () => void;
  onJoinGame: (gameId: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  user,
  guestName,
  onOpenAuthModal,
  onJoinGame
}) => {
  const [activeLobbies, setActiveLobbies] = useState<MultiplayerGameState[]>([]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPlayer: Player = {
    id: getPlayerId(user, guestName),
    name: user ? (user.displayName || 'Player') : guestName,
    photoURL: user?.photoURL || '',
    isGuest: !user
  };

  // Subscribe to public open lobbies
  useEffect(() => {
    const q = query(collection(db, 'games'), where('status', '==', 'lobby'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lobbies: MultiplayerGameState[] = [];
      const now = Date.now();
      const FIFTEEN_MINS_MS = 15 * 60 * 1000;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MultiplayerGameState;
        const createdAt = data.createdAt || 0;

        if (now - createdAt >= FIFTEEN_MINS_MS) {
          // Auto-delete room expired (>15 mins without starting)
          deleteDoc(doc(db, 'games', docSnap.id)).catch((err) =>
            console.error('Error auto-deleting stale room:', err)
          );
        } else {
          lobbies.push({ id: docSnap.id, ...data });
        }
      });
      setActiveLobbies(lobbies);
    }, (err) => {
      console.error('Lobbies snapshot error:', err);
    });

    return () => unsubscribe();
  }, []);

  // Generate 6-char room code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Create game room
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setErrorMsg(null);
      sounds.playClickSound();

      const code = generateCode();
      const newGame: Omit<MultiplayerGameState, 'id'> = {
        code,
        status: 'lobby',
        hostId: currentPlayer.id,
        maxPlayers,
        players: [{ ...currentPlayer, isHost: true, isReady: true }],
        currentTurnIndex: 0,
        round: 1,
        dice: [1, 2, 3, 4, 5],
        held: [false, false, false, false, false],
        rollsLeft: 3,
        isRolling: false,
        scores: {
          [currentPlayer.id]: {}
        },
        chat: [
          {
            id: `msg_${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `Room created! Invite friends with code ${code}`,
            timestamp: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'games'), newGame);
      onJoinGame(docRef.id);
    } catch (err: unknown) {
      console.error('Error creating room:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create room.');
    } finally {
      setIsCreating(false);
    }
  };

  // Join by room code or ID
  const handleJoinByCode = async (targetCode?: string) => {
    const codeToSearch = (targetCode || roomCodeInput).trim().toUpperCase();
    if (!codeToSearch) return;

    try {
      setIsJoining(true);
      setErrorMsg(null);
      sounds.playClickSound();

      const q = query(collection(db, 'games'), where('code', '==', codeToSearch), where('status', '==', 'lobby'));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg(`No active lobby found with code: ${codeToSearch}`);
        setIsJoining(false);
        return;
      }

      const gameDoc = snap.docs[0];
      const gameData = gameDoc.data() as MultiplayerGameState;

      // Check 15-min expiration limit
      const createdAt = gameData.createdAt || 0;
      if (Date.now() - createdAt >= 15 * 60 * 1000) {
        await deleteDoc(doc(db, 'games', gameDoc.id)).catch(() => {});
        setErrorMsg('This room expired because the game was not started within 15 minutes.');
        setIsJoining(false);
        return;
      }

      // Check if already in room or room is full
      const existingPlayer = gameData.players.find(p => p.id === currentPlayer.id);
      if (!existingPlayer && gameData.players.length >= gameData.maxPlayers) {
        setErrorMsg('This game room is already full!');
        setIsJoining(false);
        return;
      }

      if (!existingPlayer) {
        let playerToAdd = { ...currentPlayer };
        const sameNameCount = gameData.players.filter(p => p.name.startsWith(currentPlayer.name)).length;
        if (sameNameCount > 0) {
          playerToAdd.name = `${currentPlayer.name} ${sameNameCount + 1}`;
        }

        const updatedPlayers = [...gameData.players, playerToAdd];
        const updatedScores = {
          ...gameData.scores,
          [playerToAdd.id]: {}
        };

        await updateDoc(doc(db, 'games', gameDoc.id), {
          players: updatedPlayers,
          scores: updatedScores,
          updatedAt: Date.now()
        });
      }

      onJoinGame(gameDoc.id);
    } catch (err: unknown) {
      console.error('Error joining room:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join room.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            Real-Time Multiplayer Lobbies
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Play turn-based Yahtzee live with 2 to 6 players worldwide!
          </p>
        </div>

        {!user && (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Sign In for Full Rank Sync
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Single Column Layout: Host/Join & Active Lobbies */}
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Host Room & Join Code */}
        <div className="flex flex-col gap-6 w-full">
          {/* Create Room Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Host a New Room
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Max Players</label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
                      maxPlayers === num
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {num} P
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {isCreating ? 'Creating Room...' : 'Create Multiplayer Room'}
            </button>
          </div>

          {/* Join with Code Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" /> Join via Room Code
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER 6-CHAR CODE"
                maxLength={6}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-center font-bold tracking-widest text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleJoinByCode()}
                disabled={isJoining || !roomCodeInput.trim()}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition-all"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>

        {/* Public Open Rooms */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> Public Waiting Rooms ({activeLobbies.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full animate-pulse">
              Live Updates
            </span>
          </div>

          {activeLobbies.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 gap-2">
              <Users className="w-10 h-10 stroke-1 opacity-40" />
              <p className="text-sm">No open rooms right now.</p>
              <p className="text-xs">Create a room on the left to invite your friends!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {activeLobbies.map((lobby) => {
                const isFull = lobby.players.length >= lobby.maxPlayers;
                const host = lobby.players.find(p => p.isHost) || lobby.players[0];

                return (
                  <div
                    key={lobby.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono border border-slate-700">
                        {lobby.code}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                          {host?.name}'s Room
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-normal">
                            <Crown className="w-3 h-3 inline" /> Host
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{lobby.players.length} / {lobby.maxPlayers} Players</span>
                          <span>•</span>
                          <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            Expires in {Math.max(1, Math.ceil((15 * 60 * 1000 - (Date.now() - (lobby.createdAt || Date.now()))) / 60000))}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinByCode(lobby.code)}
                      disabled={isFull}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isFull
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md'
                      }`}
                    >
                      {isFull ? 'Room Full' : 'Join Room'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

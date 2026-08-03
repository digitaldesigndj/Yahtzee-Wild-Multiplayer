import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { MultiplayerGameState, CategoryKey, ScoreCard, ChatMessage } from '../types/yahtzee';
import { calculateCategoryScore, updateScoreCardTotals, isScoreCardFinished, isYahtzee } from '../lib/yahtzeeLogic';
import { getPlayerId } from '../lib/player';
import { Dice3D } from './Dice3D';
import { ScoreBoard } from './ScoreBoard';
import { FireworksOverlay } from './FireworksOverlay';
import { sounds } from '../lib/audio';
import { Users, Crown, Send, Trophy, ArrowLeft, Copy, Check, MessageSquare, Sparkles, RefreshCw, Clock } from 'lucide-react';

interface MultiplayerGameProps {
  gameId: string;
  user: User | null;
  guestName: string;
  onLeaveGame: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  gameId,
  user,
  guestName,
  onLeaveGame
}) => {
  const [game, setGame] = useState<MultiplayerGameState | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatText, setChatText] = useState('');
  const [selectedTabPlayerId, setSelectedTabPlayerId] = useState<string | null>(null);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myId = getPlayerId(user, guestName);

  // 15-minute room expiration check while in lobby
  useEffect(() => {
    if (!game || game.status !== 'lobby') return;

    const createdAt = game.createdAt || Date.now();
    const FIFTEEN_MINS_MS = 15 * 60 * 1000;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current - createdAt >= FIFTEEN_MINS_MS) {
        clearInterval(timer);
        deleteDoc(doc(db, 'games', gameId)).catch((err) =>
          console.error('Error auto-deleting expired room:', err)
        );
        alert('This room has expired because the game was not started within 15 minutes.');
        onLeaveGame();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.status, game?.createdAt, gameId, onLeaveGame]);

  const hasCelebratedRef = useRef(false);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as MultiplayerGameState;
        setGame(data);

        // If game just finished, trigger fireworks once
        if (data.status === 'finished' && !hasCelebratedRef.current) {
          hasCelebratedRef.current = true;
          setShowFireworks(true);
        }
      } else {
        onLeaveGame();
      }
    });

    return () => unsub();
  }, [gameId]);

  // Scroll chat box internally without moving window
  const chatBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [game?.chat]);

  if (!game) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Connecting to Multiplayer Room...</p>
      </div>
    );
  }

  const isHost = game.players.length > 0 && (game.players[0].id === myId || game.hostId === myId);
  const currentPlayer = game.players[game.currentTurnIndex] || game.players[0];
  const isMyTurn = currentPlayer?.id === myId;
  const myScoreCard = game.scores[myId] || {};

  // Copy room code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopiedCode(true);
    sounds.playClickSound();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Host starts the game
  const handleStartGame = async () => {
    if (!isHost) return;
    sounds.playScoreSound();
    await updateDoc(doc(db, 'games', gameId), {
      status: 'playing',
      currentTurnIndex: 0,
      round: 1,
      rollsLeft: 3,
      dice: [1, 2, 3, 4, 5],
      held: [false, false, false, false, false],
      updatedAt: Date.now()
    });
  };

  // Roll dice in multiplayer
  const handleRollDice = async () => {
    if (!isMyTurn || game.rollsLeft <= 0 || game.isRolling) return;

    sounds.playRollSound();

    // Set rolling status for all players to see animation
    await updateDoc(doc(db, 'games', gameId), { isRolling: true });

    setTimeout(async () => {
      const nextDice = game.dice.map((val, idx) => {
        if (game.held[idx] && game.rollsLeft < 3) return val;
        return Math.random() < 0.12 ? 7 : Math.floor(Math.random() * 6) + 1;
      });

      const nextHeld = game.held.map((h, idx) => h || nextDice[idx] === 7);

      if (isYahtzee(nextDice)) {
        sounds.playYahtzeeFanfare();
      }

      await updateDoc(doc(db, 'games', gameId), {
        dice: nextDice,
        held: nextHeld,
        rollsLeft: game.rollsLeft - 1,
        isRolling: false,
        updatedAt: Date.now()
      });
    }, 600);
  };

  // Toggle hold in multiplayer
  const handleToggleHold = async (idx: number) => {
    if (!isMyTurn || game.rollsLeft === 3 || game.isRolling) return;
    if (game.dice[idx] === 7) return;
    sounds.playClickSound();

    const nextHeld = [...game.held];
    nextHeld[idx] = !nextHeld[idx];

    await updateDoc(doc(db, 'games', gameId), {
      held: nextHeld,
      updatedAt: Date.now()
    });
  };

  // Select score category in multiplayer
  const handleSelectCategory = async (category: CategoryKey) => {
    if (!isMyTurn || game.rollsLeft === 3 || game.isRolling) return;

    const points = calculateCategoryScore(category, game.dice, myScoreCard);

    let nextYahtzeeBonus = myScoreCard.yahtzeeBonusCount || 0;
    const isYahtzeeRoll = isYahtzee(game.dice);
    if (isYahtzeeRoll && myScoreCard.yahtzee === 50 && category !== 'yahtzee') {
      nextYahtzeeBonus++;
    }

    const nextCard: ScoreCard = {
      ...myScoreCard,
      [category]: points,
      yahtzeeBonusCount: nextYahtzeeBonus
    };

    const updatedCard = updateScoreCardTotals(nextCard);
    const updatedScores = {
      ...game.scores,
      [myId]: updatedCard
    };

    // Calculate turn progression (alternate turns)
    const nextTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
    let nextRound = game.round;
    if (nextTurnIndex === 0) {
      nextRound += 1;
    }

    // Reset scorecard view selection so next turn player's scorecard shows automatically
    setSelectedTabPlayerId(null);

    // Check if game has concluded for all players (all players complete all 13 rounds)
    const allFinished = game.players.every((p) => {
      const pCard = updatedScores[p.id] || {};
      return isScoreCardFinished(pCard);
    });

    let winnerId: string | undefined = game.winnerId;
    let newStatus = game.status;

    if (allFinished || nextRound > 13) {
      newStatus = 'finished';
      let highestScore = -1;
      game.players.forEach((p) => {
        const sc = updatedScores[p.id] || {};
        const total = sc.grandTotal || 0;
        if (total > highestScore) {
          highestScore = total;
          winnerId = p.id;
        }
      });

      // Save high score to Firestore leaderboard for winner
      const winnerPlayer = game.players.find(p => p.id === winnerId);
      if (winnerPlayer) {
        addDoc(collection(db, 'highScores'), {
          userId: winnerPlayer.id,
          userName: winnerPlayer.name,
          userPhoto: winnerPlayer.photoURL || '',
          score: highestScore,
          mode: 'multiplayer',
          createdAt: new Date().toISOString()
        }).catch(err => console.error('Error saving multiplayer high score:', err));
      }
    }

    const updatePayload: Record<string, any> = {
      scores: updatedScores,
      currentTurnIndex: nextTurnIndex,
      round: nextRound,
      status: newStatus,
      rollsLeft: 3,
      held: [false, false, false, false, false],
      dice: [1, 2, 3, 4, 5],
      updatedAt: Date.now()
    };

    if (winnerId !== undefined) {
      updatePayload.winnerId = winnerId;
    }

    await updateDoc(doc(db, 'games', gameId), updatePayload);
  };

  // Send in-game chat message
  const handleSendChat = async (textToSend?: string) => {
    const text = (textToSend || chatText).trim();
    if (!text) return;

    const myName = user ? (user.displayName || 'Player') : guestName;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: myId,
      senderName: myName,
      text,
      timestamp: Date.now()
    };

    const updatedChat = [...(game.chat || []), newMsg];
    setChatText('');
    await updateDoc(doc(db, 'games', gameId), {
      chat: updatedChat,
      updatedAt: Date.now()
    });
  };

  // Render LOBBY Waiting Screen
  if (game.status === 'lobby') {
    const createdAt = game.createdAt || Date.now();
    const FIFTEEN_MINS_MS = 15 * 60 * 1000;
    const remainingMs = Math.max(0, (createdAt + FIFTEEN_MINS_MS) - now);
    const remSecs = Math.floor(remainingMs / 1000);
    const remMins = Math.floor(remSecs / 60);
    const remSecsModulo = remSecs % 60;
    const formattedCountdown = `${remMins}:${remSecsModulo < 10 ? '0' : ''}${remSecsModulo}`;

    return (
      <div className="flex flex-col gap-6 items-center w-full max-w-4xl mx-auto px-4 py-8">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-2 flex-wrap">
            <button
              type="button"
              onClick={onLeaveGame}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Leave Room
            </button>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Auto-expires in {formattedCountdown}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 px-4 py-1.5 rounded-xl">
                <span className="text-xs text-slate-400 font-semibold">ROOM CODE:</span>
                <span className="font-mono text-emerald-400 font-black text-lg tracking-widest">{game.code}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="ml-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Copy Room Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Player list */}
          <div>
            <h3 className="text-base font-extrabold text-slate-200 mb-3 flex items-center justify-between">
              <span>Joined Players ({game.players.length} / {game.maxPlayers})</span>
              <span className="text-xs text-slate-400 font-normal">Waiting for host to start...</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {game.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {p.photoURL ? (
                      <img src={p.photoURL} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        {p.name}
                        {p.isHost && (
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Crown className="w-3 h-3" /> Host
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-400">Ready in Lobby</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            {isHost ? (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleStartGame}
                  disabled={game.players.length < 2}
                  className={`px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-xl shadow-xl transition-all flex items-center gap-2 ${
                    game.players.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Sparkles className="w-5 h-5" /> Start Multiplayer Game
                </button>
                {game.players.length < 2 && (
                  <span className="text-xs text-amber-400 font-semibold italic">
                    Waiting for at least 1 more player to join room code {game.code}...
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">
                Waiting for host ({game.players[0]?.name}) to launch game...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render FINISHED Screen (Podium)
  if (game.status === 'finished') {
    const sortedPlayers = [...game.players].sort((a, b) => {
      const scoreA = game.scores[a.id]?.grandTotal || 0;
      const scoreB = game.scores[b.id]?.grandTotal || 0;
      return scoreB - scoreA;
    });

    const winner = sortedPlayers[0];

    return (
      <div className="flex flex-col gap-6 items-center w-full max-w-4xl mx-auto px-4 py-8">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-2xl">
            <Trophy className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-slate-100">
              {winner?.name} Wins the Match!
            </h2>
            <p className="text-amber-400 font-mono font-bold text-xl mt-1">
              Top Score: {game.scores[winner?.id]?.grandTotal || 0} pts
            </p>
          </div>

          {/* Final Standings Table */}
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-left border-b border-slate-800">
              Final Leaderboard Standings
            </div>
            <div className="divide-y divide-slate-800">
              {sortedPlayers.map((p, idx) => {
                const pScore = game.scores[p.id]?.grandTotal || 0;
                return (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">{pScore} pts</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onLeaveGame}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Return to Lobbies
          </button>
        </div>
      </div>
    );
  }

  // Active PLAYING view
  const displayScorePlayerId = selectedTabPlayerId || myId;
  const displayScoreCard = game.scores[displayScorePlayerId] || {};
  const displayPlayer = game.players.find(p => p.id === displayScorePlayerId);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Top Bar Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeaveGame}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-950 rounded-xl border border-slate-800 transition-colors"
            title="Leave Game"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Round {Math.min(game.round, 13)} / 13</div>
            <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
              Current Turn: <span className="text-slate-100">{currentPlayer?.name}</span>
              {isMyTurn && <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">YOUR TURN!</span>}
            </div>
          </div>
        </div>

        {/* Players Turn Trackers */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {game.players.map((p, idx) => {
            const isTurn = game.currentTurnIndex === idx;
            const pScore = game.scores[p.id]?.grandTotal || 0;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedTabPlayerId(p.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  isTurn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{p.name}</span>
                <span className="font-mono text-amber-400">{pScore}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Roll Box */}
      <div className="sticky top-2 z-30 w-full flex justify-center">
        <Dice3D
          dice={game.dice}
          held={game.held}
          onToggleHold={handleToggleHold}
          onRoll={handleRollDice}
          rollsLeft={game.rollsLeft}
          isRolling={game.isRolling}
          disabled={!isMyTurn}
        />
      </div>

      {/* Main Content (Scorecard & Chat) - Scrolls under roll box */}
      <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Scorecards */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
          {/* Player Scorecard Tab Switcher */}
          <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full overflow-x-auto scrollbar-none">
            {game.players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedTabPlayerId(p.id)}
                className={`flex-1 min-w-[64px] py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all truncate ${
                  displayScorePlayerId === p.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.id === myId ? 'My Score' : p.name}
              </button>
            ))}
          </div>

          <ScoreBoard
            scoreCard={displayScoreCard}
            dice={game.dice}
            rollsLeft={game.rollsLeft}
            onSelectCategory={handleSelectCategory}
            isMyTurn={isMyTurn && displayScorePlayerId === myId}
            disabled={!isMyTurn || displayScorePlayerId !== myId}
            playerName={displayPlayer?.name}
          />
        </div>

        {/* Live Chat & Reactions Box */}
        <div className="w-full lg:max-w-xs bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 backdrop-blur-md">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Live Match Chat & Reactions
          </h4>

          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
            {['🎲', '🏆', '🔥', '😮', '😂', '👍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendChat(emoji)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Message log */}
          <div ref={chatBoxRef} className="h-40 overflow-y-auto flex flex-col gap-1.5 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {(game.chat || []).map((msg) => (
              <div key={msg.id} className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-400">{msg.senderName}:</span>
                <span className="text-slate-200">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Send chat message..."
              maxLength={80}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {showFireworks && (
        <FireworksOverlay durationMs={15000} onComplete={() => setShowFireworks(false)} />
      )}
    </div>
  );
};

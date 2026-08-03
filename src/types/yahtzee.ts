export type CategoryKey =
  | 'ones'
  | 'twos'
  | 'threes'
  | 'fours'
  | 'fives'
  | 'sixes'
  | 'threeOfAKind'
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yahtzee'
  | 'chance';

export interface ScoreCard {
  ones?: number;
  twos?: number;
  threes?: number;
  fours?: number;
  fives?: number;
  sixes?: number;
  upperSubtotal?: number;
  upperBonus?: number;
  upperTotal?: number;
  
  threeOfAKind?: number;
  fourOfAKind?: number;
  fullHouse?: number;
  smallStraight?: number;
  largeStraight?: number;
  yahtzee?: number;
  chance?: number;
  yahtzeeBonusCount?: number;
  lowerTotal?: number;
  
  grandTotal?: number;
}

export interface Player {
  id: string;
  name: string;
  photoURL?: string;
  isHost?: boolean;
  isReady?: boolean;
  isGuest?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface MultiplayerGameState {
  id: string;
  code: string;
  status: 'lobby' | 'playing' | 'finished';
  hostId: string;
  maxPlayers: number;
  players: Player[];
  currentTurnIndex: number;
  round: number; // 1 to 13
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  isRolling: boolean;
  scores: Record<string, ScoreCard>;
  chat: ChatMessage[];
  winnerId?: string;
  updatedAt: number;
  createdAt: number;
}

export interface HighScoreEntry {
  id?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  score: number;
  mode: 'solo' | 'multiplayer';
  createdAt: string;
}

export type ActiveTab = 'solo' | 'multiplayer' | 'leaderboard' | 'rules';

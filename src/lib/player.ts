import { User } from 'firebase/auth';

export function generateDefaultGuestName(): string {
  const digits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `Player${digits}`;
}

export function getPlayerId(user: User | null, _guestName?: string): string {
  if (user && user.uid) {
    return user.uid;
  }
  let stored = sessionStorage.getItem('yahtzee_guest_id');
  if (!stored) {
    stored = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('yahtzee_guest_id', stored);
  }
  return stored;
}

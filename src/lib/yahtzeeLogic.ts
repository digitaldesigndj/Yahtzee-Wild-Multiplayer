import { CategoryKey, ScoreCard } from '../types/yahtzee';

// Helper to get frequency count of dice values
export function getDiceCounts(dice: number[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const val of dice) {
    if (counts[val] !== undefined) {
      counts[val]++;
    }
  }
  return counts;
}

// Check if dice contains a sequence of length `len`
export function hasSequence(dice: number[], len: number): boolean {
  const uniqueSorted = Array.from(new Set(dice)).sort((a, b) => a - b);
  if (uniqueSorted.length < len) return false;

  let consecutive = 1;
  let maxConsecutive = 1;

  for (let i = 0; i < uniqueSorted.length - 1; i++) {
    if (uniqueSorted[i + 1] === uniqueSorted[i] + 1) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }

  return maxConsecutive >= len;
}

// Calculate potential score for a single category given current dice and existing scorecard
function calculateCategoryScoreStandard(
  category: CategoryKey,
  dice: number[],
  currentScoreCard: ScoreCard = {}
): number {
  const sum = dice.reduce((acc, curr) => acc + curr, 0);
  const counts = getDiceCounts(dice);
  const countsList = Object.values(counts);
  const isYahtzee = countsList.includes(5);

  // Upper section
  switch (category) {
    case 'ones':
      return counts[1] * 1;
    case 'twos':
      return counts[2] * 2;
    case 'threes':
      return counts[3] * 3;
    case 'fours':
      return counts[4] * 4;
    case 'fives':
      return counts[5] * 5;
    case 'sixes':
      return counts[6] * 6;

    case 'threeOfAKind':
      return countsList.some(c => c >= 3) ? sum : 0;

    case 'fourOfAKind':
      return countsList.some(c => c >= 4) ? sum : 0;

    case 'fullHouse': {
      // Standard full house: 3 of one kind and 2 of another kind
      const isStandardFH = (countsList.includes(3) && countsList.includes(2));
      // Joker Rule: If Yahtzee is rolled and Yahtzee box is already scored with 50, Full House scores 25
      const isYahtzeeJoker = isYahtzee && currentScoreCard.yahtzee === 50;
      return (isStandardFH || isYahtzeeJoker) ? 25 : 0;
    }

    case 'smallStraight': {
      const isStandardSS = hasSequence(dice, 4);
      const isYahtzeeJoker = isYahtzee && currentScoreCard.yahtzee === 50;
      return (isStandardSS || isYahtzeeJoker) ? 30 : 0;
    }

    case 'largeStraight': {
      const isStandardLS = hasSequence(dice, 5);
      const isYahtzeeJoker = isYahtzee && currentScoreCard.yahtzee === 50;
      return (isStandardLS || isYahtzeeJoker) ? 40 : 0;
    }

    case 'yahtzee':
      return isYahtzee ? 50 : 0;

    case 'chance':
      return sum;

    default:
      return 0;
  }
}

export function isYahtzee(dice: number[]): boolean {
  if (dice.length !== 5 || dice.some(d => d === 0)) return false;
  return calculateCategoryScore('yahtzee', dice) === 50;
}

export function calculateCategoryScore(
  category: CategoryKey,
  dice: number[],
  currentScoreCard: ScoreCard = {}
): number {
  if (dice.length !== 5 || dice.some(d => d === 0)) return 0;

  if (dice.includes(7)) {
    return calculateWildCategoryScore(category, dice, currentScoreCard);
  }

  return calculateCategoryScoreStandard(category, dice, currentScoreCard);
}

function calculateWildCategoryScore(
  category: CategoryKey,
  dice: number[],
  currentScoreCard: ScoreCard
): number {
  const wildIndices = dice.map((v, i) => (v === 7 ? i : -1)).filter(i => i !== -1);
  let maxScore = 0;

  function permute(index: number, currentDice: number[]) {
    if (index === wildIndices.length) {
      const score = calculateCategoryScoreStandard(category, currentDice, currentScoreCard);
      if (score > maxScore) maxScore = score;
      return;
    }
    const idx = wildIndices[index];
    for (let val = 1; val <= 6; val++) {
      currentDice[idx] = val;
      permute(index + 1, currentDice);
    }
  }

  permute(0, [...dice]);
  return maxScore;
}

// Recalculate full totals for a scorecard
export function updateScoreCardTotals(card: ScoreCard): ScoreCard {
  const newCard: ScoreCard = { ...card };

  const upperKeys: (keyof ScoreCard)[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  let upperSubtotal = 0;
  for (const key of upperKeys) {
    if (typeof newCard[key] === 'number') {
      upperSubtotal += newCard[key] as number;
    }
  }

  const upperBonus = upperSubtotal >= 63 ? 35 : 0;
  const upperTotal = upperSubtotal + upperBonus;

  const lowerKeys: (keyof ScoreCard)[] = [
    'threeOfAKind',
    'fourOfAKind',
    'fullHouse',
    'smallStraight',
    'largeStraight',
    'yahtzee',
    'chance'
  ];

  let lowerSubtotal = 0;
  for (const key of lowerKeys) {
    if (typeof newCard[key] === 'number') {
      lowerSubtotal += newCard[key] as number;
    }
  }

  const yahtzeeBonus = (newCard.yahtzeeBonusCount || 0) * 100;
  const lowerTotal = lowerSubtotal + yahtzeeBonus;

  const grandTotal = upperTotal + lowerTotal;

  return {
    ...newCard,
    upperSubtotal,
    upperBonus,
    upperTotal,
    lowerTotal,
    grandTotal
  };
}

// Check if all 13 categories are filled
export function isScoreCardFinished(card: ScoreCard): boolean {
  const categories: CategoryKey[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ];

  return categories.every(cat => typeof card[cat] === 'number');
}

// Format category names for user UI display
export const CATEGORY_LABELS: Record<CategoryKey, { name: string; desc: string; section: 'upper' | 'lower' }> = {
  ones: { name: 'Ones (Aces)', desc: 'Sum of 1s', section: 'upper' },
  twos: { name: 'Twos', desc: 'Sum of 2s', section: 'upper' },
  threes: { name: 'Threes', desc: 'Sum of 3s', section: 'upper' },
  fours: { name: 'Fours', desc: 'Sum of 4s', section: 'upper' },
  fives: { name: 'Fives', desc: 'Sum of 5s', section: 'upper' },
  sixes: { name: 'Sixes', desc: 'Sum of 6s', section: 'upper' },
  threeOfAKind: { name: '3 of a Kind', desc: 'Sum of all 5 dice', section: 'lower' },
  fourOfAKind: { name: '4 of a Kind', desc: 'Sum of all 5 dice', section: 'lower' },
  fullHouse: { name: 'Full House', desc: '3 of a kind + Pair (25 pts)', section: 'lower' },
  smallStraight: { name: 'Small Straight', desc: 'Sequence of 4 (30 pts)', section: 'lower' },
  largeStraight: { name: 'Large Straight', desc: 'Sequence of 5 (40 pts)', section: 'lower' },
  yahtzee: { name: 'Yahtzee', desc: '5 of a kind (50 pts)', section: 'lower' },
  chance: { name: 'Chance', desc: 'Sum of all 5 dice', section: 'lower' }
};

export interface PlayerScore {
  memberName: string;
  score: number;
}

export const TOTAL_GAME_SCORE = 1000;
export const TOTAL_GAME_SCORE_TOLERANCE = 0.001;

export function getRankBonus(rank: number): number {
  switch (rank) {
    case 1:
      return 50;
    case 2:
      return 10;
    case 3:
      return -10;
    case 4:
      return -30;
    default:
      return 0;
  }
}

export function processTiedScores(players: PlayerScore[]) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const ranks: number[] = new Array(sortedPlayers.length).fill(0);
  const rankBonuses: number[] = new Array(sortedPlayers.length).fill(0);

  let currentRank = 1;
  let i = 0;
  while (i < sortedPlayers.length) {
    let j = i + 1;
    while (j < sortedPlayers.length && sortedPlayers[j].score === sortedPlayers[i].score) {
      j++;
    }

    const groupSize = j - i;
    let bonusSum = 0;
    for (let offset = 0; offset < groupSize; offset++) {
      bonusSum += getRankBonus(currentRank + offset);
    }
    const bonus = bonusSum / groupSize;

    for (let k = i; k < j; k++) {
      ranks[k] = currentRank;
      rankBonuses[k] = bonus;
    }

    currentRank += groupSize;
    i = j;
  }

  return { sortedPlayers, ranks, rankBonuses };
}

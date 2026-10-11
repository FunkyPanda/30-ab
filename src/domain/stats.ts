import { currentScores, winners } from './scoring';
import type { Game } from './types';

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  avgFinalScore: number | null;
  roundsPlayed: number;
  roundsSatOut: number;
  declarerRounds: number;
  declarerSuccess: number;
  zeroTrickRounds: number;
  totalTricks: number;
}

/** Aggregates stats over all finished games (rounds of running games are ignored). */
export function computeStats(playerId: string, games: Game[]): PlayerStats {
  const finished = games.filter((g) => g.status === 'finished' && g.playerIds.includes(playerId));
  const stats: PlayerStats = {
    playerId,
    gamesPlayed: finished.length,
    gamesWon: 0,
    winRate: 0,
    avgFinalScore: null,
    roundsPlayed: 0,
    roundsSatOut: 0,
    declarerRounds: 0,
    declarerSuccess: 0,
    zeroTrickRounds: 0,
    totalTricks: 0,
  };
  let scoreSum = 0;
  for (const game of finished) {
    const scores = currentScores(game);
    scoreSum += scores[playerId];
    if (winners(scores).includes(playerId)) stats.gamesWon++;
    for (const round of game.rounds) {
      const entry = round.entries.find((e) => e.playerId === playerId);
      if (!entry) continue;
      if (entry.sittingOut) {
        stats.roundsSatOut++;
        continue;
      }
      stats.roundsPlayed++;
      stats.totalTricks += entry.tricks;
      if (round.declarerId === playerId) {
        stats.declarerRounds++;
        if (entry.tricks >= round.bid) stats.declarerSuccess++;
      } else if (entry.tricks === 0) {
        stats.zeroTrickRounds++;
      }
    }
  }
  if (finished.length > 0) {
    stats.winRate = stats.gamesWon / finished.length;
    stats.avgFinalScore = scoreSum / finished.length;
  }
  return stats;
}

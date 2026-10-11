import { TRICKS_PER_ROUND } from './scoring';
import type { Game, RoundEntry, Suit } from './types';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MAX_SIT_OUTS_PER_ROUND = 2;
export const MAX_CONSECUTIVE_SIT_OUTS = 2;

/** How many of the most recent rounds the player sat out in a row. */
export function consecutiveSitOuts(game: Game, playerId: string, beforeRound = game.rounds.length): number {
  let count = 0;
  for (let i = beforeRound - 1; i >= 0; i--) {
    const entry = game.rounds[i].entries.find((e) => e.playerId === playerId);
    if (!entry?.sittingOut) break;
    count++;
  }
  return count;
}

export type SitOutBlockReason = 'declarer' | 'kreuz' | 'limitReached' | 'consecutive' | 'tooFewPlayers';

/** Returns why a player may not sit out, or null if allowed. */
export function sitOutBlockReason(params: {
  game: Game;
  playerId: string;
  declarerId: string;
  trump: Suit;
  currentlyOut: string[];
  roundIndex: number;
}): SitOutBlockReason | null {
  const { game, playerId, declarerId, trump, currentlyOut, roundIndex } = params;
  if (playerId === declarerId) return 'declarer';
  if (trump === 'kreuz') return 'kreuz';
  if (consecutiveSitOuts(game, playerId, roundIndex) >= MAX_CONSECUTIVE_SIT_OUTS) return 'consecutive';
  if (currentlyOut.includes(playerId)) return null;
  if (currentlyOut.length >= MAX_SIT_OUTS_PER_ROUND) return 'limitReached';
  // Need at least two active players for a trick game.
  if (game.playerIds.length - currentlyOut.length - 1 < MIN_PLAYERS) return 'tooFewPlayers';
  return null;
}

export function totalTricks(entries: RoundEntry[]): number {
  return entries.filter((e) => !e.sittingOut).reduce((sum, e) => sum + e.tricks, 0);
}

export function tricksValid(entries: RoundEntry[]): boolean {
  return totalTricks(entries) === TRICKS_PER_ROUND;
}

/** Active players in clockwise order starting with the declarer. */
export function playOrder(playerIds: string[], declarerId: string, sittingOut: string[]): string[] {
  const start = playerIds.indexOf(declarerId);
  const rotated = [...playerIds.slice(start), ...playerIds.slice(0, start)];
  return rotated.filter((id) => !sittingOut.includes(id));
}

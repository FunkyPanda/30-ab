import type { Game, Round, RoundEntry, Suit } from './types';

export const TRICKS_PER_ROUND = 5;
export const MAX_BID = TRICKS_PER_ROUND;
export const ZERO_TRICKS_PENALTY = 5;
/** Added to the bid when the declarer misses it. */
export const DECLARER_FAIL_PENALTY = 5;

export function multiplierFor(trump: Suit): number {
  return trump === 'herz' ? 2 : 1;
}

export interface DeltaInput {
  isDeclarer: boolean;
  sittingOut: boolean;
  tricks: number;
  bid: number;
  trump: Suit;
}

/**
 * Score change for one player in one round (negative = good, the goal is to reach 0).
 * - Sitting out: 0
 * - Declarer: made >= bid -> -(bid + tricks), otherwise +(bid + 5)
 * - Others: 0 tricks -> +5, otherwise -1 per trick
 * - Herz as trump doubles everything.
 */
export function calcDelta({ isDeclarer, sittingOut, tricks, bid, trump }: DeltaInput): number {
  if (sittingOut) return 0;
  let base: number;
  if (isDeclarer) {
    base = tricks >= bid ? -(bid + tricks) : bid + DECLARER_FAIL_PENALTY;
  } else {
    base = tricks === 0 ? ZERO_TRICKS_PENALTY : -tricks;
  }
  return base * multiplierFor(trump);
}

/** Recalculates calculatedDelta for every entry; keeps manual overrides only if `keepOverrides`. */
export function recalcEntries(round: Omit<Round, 'entries'>, entries: RoundEntry[], keepOverrides = true): RoundEntry[] {
  return entries.map((e) => {
    const calculatedDelta = calcDelta({
      isDeclarer: e.playerId === round.declarerId,
      sittingOut: e.sittingOut,
      tricks: e.sittingOut ? 0 : e.tricks,
      bid: round.bid,
      trump: round.trump,
    });
    const overridden = keepOverrides && e.delta !== e.calculatedDelta;
    return { ...e, calculatedDelta, delta: overridden ? e.delta : calculatedDelta };
  });
}

/** Current score of every player, derived from start score, rounds and corrections. */
export function currentScores(game: Game, upToRound = game.rounds.length): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const id of game.playerIds) scores[id] = game.startScore;
  game.rounds.slice(0, upToRound).forEach((round) => {
    for (const e of round.entries) scores[e.playerId] += e.delta;
  });
  for (const c of game.corrections) {
    if (c.afterRound <= upToRound) scores[c.playerId] += c.delta;
  }
  return scores;
}

export function isGameOver(scores: Record<string, number>): boolean {
  return Object.values(scores).some((s) => s <= 0);
}

/**
 * Updates the game status after rounds or corrections changed:
 * finishes the game once someone reached 0, and reopens an auto-finished game if an edit undid that.
 */
export function syncStatus(game: Game): Game {
  const over = isGameOver(currentScores(game));
  if (over) {
    return game.status === 'finished' ? game : { ...game, status: 'finished', finishedAt: Date.now(), endedManually: false };
  }
  if (game.status === 'finished' && !game.endedManually) {
    return { ...game, status: 'running', finishedAt: undefined };
  }
  return game;
}

/** Player ids with the lowest score (several on a tie). */
export function winners(scores: Record<string, number>): string[] {
  const min = Math.min(...Object.values(scores));
  return Object.keys(scores).filter((id) => scores[id] === min);
}

/** Player ids sorted by score ascending (best first). */
export function ranking(scores: Record<string, number>): string[] {
  return Object.keys(scores).sort((a, b) => scores[a] - scores[b]);
}

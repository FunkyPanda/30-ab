import { describe, expect, it } from 'vitest';
import { calcDelta, currentScores, isGameOver, ranking, syncStatus, winners } from './scoring';
import type { Game } from './types';

const base = { sittingOut: false, trump: 'pik' as const };

describe('calcDelta', () => {
  it('declarer makes exactly the bid: 3/3 -> -6', () => {
    expect(calcDelta({ ...base, isDeclarer: true, bid: 3, tricks: 3 })).toBe(-6);
  });
  it('declarer overachieves: 4/5 -> -9', () => {
    expect(calcDelta({ ...base, isDeclarer: true, bid: 4, tricks: 5 })).toBe(-9);
  });
  it('declarer fails -> +(bid + 5)', () => {
    expect(calcDelta({ ...base, isDeclarer: true, bid: 3, tricks: 2 })).toBe(8);
    expect(calcDelta({ ...base, isDeclarer: true, bid: 2, tricks: 0 })).toBe(7);
  });
  it('other player: -1 per trick', () => {
    expect(calcDelta({ ...base, isDeclarer: false, bid: 3, tricks: 2 })).toBe(-2);
  });
  it('other player with zero tricks -> +5', () => {
    expect(calcDelta({ ...base, isDeclarer: false, bid: 3, tricks: 0 })).toBe(5);
  });
  it('sitting out -> 0', () => {
    expect(calcDelta({ ...base, sittingOut: true, isDeclarer: false, bid: 3, tricks: 0 })).toBe(0);
  });
  it('herz doubles everything', () => {
    const herz = { ...base, trump: 'herz' as const };
    expect(calcDelta({ ...herz, isDeclarer: true, bid: 3, tricks: 3 })).toBe(-12);
    expect(calcDelta({ ...herz, isDeclarer: true, bid: 3, tricks: 1 })).toBe(16);
    expect(calcDelta({ ...herz, isDeclarer: false, bid: 3, tricks: 0 })).toBe(10);
    expect(calcDelta({ ...herz, isDeclarer: false, bid: 3, tricks: 2 })).toBe(-4);
  });
});

describe('scores', () => {
  const game: Game = {
    id: 'g',
    playerIds: ['a', 'b'],
    startScore: 10,
    status: 'running',
    createdAt: 0,
    rounds: [
      {
        declarerId: 'a',
        bid: 3,
        trump: 'pik',
        entries: [
          { playerId: 'a', sittingOut: false, tricks: 4, calculatedDelta: -7, delta: -7 },
          { playerId: 'b', sittingOut: false, tricks: 1, calculatedDelta: -1, delta: -1 },
        ],
      },
    ],
    corrections: [{ playerId: 'b', delta: 2, afterRound: 1, createdAt: 0 }],
  };

  it('derives scores from rounds and corrections', () => {
    expect(currentScores(game)).toEqual({ a: 3, b: 11 });
    expect(currentScores(game, 0)).toEqual({ a: 10, b: 10 });
  });
  it('detects game over and winners', () => {
    expect(isGameOver({ a: 3, b: 11 })).toBe(false);
    expect(isGameOver({ a: 0, b: 11 })).toBe(true);
    expect(winners({ a: -2, b: 5, c: -2 })).toEqual(['a', 'c']);
    expect(ranking({ a: 4, b: -1, c: 2 })).toEqual(['b', 'c', 'a']);
  });
});

describe('syncStatus', () => {
  const g = (delta: number, extra: Partial<Game> = {}): Game => ({
    id: 'g',
    playerIds: ['a'],
    startScore: 5,
    status: 'running',
    createdAt: 0,
    corrections: [],
    rounds: [
      {
        declarerId: 'a',
        bid: 1,
        trump: 'pik',
        entries: [{ playerId: 'a', sittingOut: false, tricks: 1, calculatedDelta: delta, delta }],
      },
    ],
    ...extra,
  });

  it('finishes the game once someone reaches 0', () => {
    expect(syncStatus(g(-5)).status).toBe('finished');
    expect(syncStatus(g(-4)).status).toBe('running');
  });
  it('reopens an auto-finished game after an edit, but keeps manually ended games', () => {
    expect(syncStatus(g(-4, { status: 'finished' })).status).toBe('running');
    expect(syncStatus(g(-4, { status: 'finished', endedManually: true })).status).toBe('finished');
  });
});

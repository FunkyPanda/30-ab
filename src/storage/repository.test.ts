import { describe, expect, it } from 'vitest';
import { parseData } from './repository';

const player = { id: 'p1', name: 'Anna', createdAt: 1 };
const game = {
  id: 'g1',
  playerIds: ['p1', 'p2'],
  startScore: 30,
  status: 'running',
  createdAt: 1,
  corrections: [{ playerId: 'p1', delta: 2, afterRound: 1, createdAt: 2 }],
  rounds: [
    {
      declarerId: 'p1',
      bid: 2,
      trump: 'pik',
      entries: [{ playerId: 'p1', sittingOut: false, tricks: 2, calculatedDelta: -4, delta: -4 }],
    },
  ],
};
const valid = { version: 1, players: [player], games: [game] };

describe('parseData', () => {
  it('accepts valid data', () => {
    expect(parseData(JSON.stringify(valid)).games).toHaveLength(1);
  });
  it('rejects invalid JSON and wrong version', () => {
    expect(() => parseData('not json')).toThrow();
    expect(() => parseData(JSON.stringify({ ...valid, version: 2 }))).toThrow();
    expect(() => parseData('null')).toThrow();
  });
  it('rejects malformed players and games', () => {
    expect(() => parseData(JSON.stringify({ ...valid, players: [{ id: 1 }] }))).toThrow();
    expect(() => parseData(JSON.stringify({ ...valid, games: [{ ...game, rounds: undefined }] }))).toThrow();
    expect(() => parseData(JSON.stringify({ ...valid, games: [{ ...game, playerIds: ['p1'] }] }))).toThrow();
    expect(() => parseData(JSON.stringify({ ...valid, games: [{ ...game, status: 'weird' }] }))).toThrow();
  });
  it('rejects bad rounds and corrections', () => {
    const badRound = { ...game.rounds[0], trump: 'joker' };
    expect(() => parseData(JSON.stringify({ ...valid, games: [{ ...game, rounds: [badRound] }] }))).toThrow();
    const badCorrection = { playerId: 'p1', delta: 'x', afterRound: 0, createdAt: 0 };
    expect(() => parseData(JSON.stringify({ ...valid, games: [{ ...game, corrections: [badCorrection] }] }))).toThrow();
  });
  it('drops unknown top-level keys', () => {
    expect(Object.keys(parseData(JSON.stringify({ ...valid, extra: 1 })))).toEqual(['version', 'players', 'games']);
  });
});

import { describe, expect, it } from 'vitest';
import { consecutiveSitOuts, playOrder, sitOutBlockReason, tricksValid } from './rules';
import type { Game, Round } from './types';

function round(out: string[]): Round {
  return {
    declarerId: 'a',
    bid: 2,
    trump: 'pik',
    entries: ['a', 'b', 'c', 'd'].map((id) => ({
      playerId: id,
      sittingOut: out.includes(id),
      tricks: 0,
      calculatedDelta: 0,
      delta: 0,
    })),
  };
}

function game(rounds: Round[]): Game {
  return { id: 'g', playerIds: ['a', 'b', 'c', 'd'], startScore: 30, rounds, corrections: [], status: 'running', createdAt: 0 };
}

const params = (g: Game, playerId: string, currentlyOut: string[] = [], trump: 'pik' | 'kreuz' = 'pik') => ({
  game: g,
  playerId,
  declarerId: 'a',
  trump,
  currentlyOut,
  roundIndex: g.rounds.length,
});

describe('sit-out rules', () => {
  it('counts consecutive sit-outs', () => {
    const g = game([round(['b']), round([]), round(['b']), round(['b'])]);
    expect(consecutiveSitOuts(g, 'b')).toBe(2);
    expect(consecutiveSitOuts(g, 'c')).toBe(0);
  });
  it('blocks the third consecutive sit-out', () => {
    const g = game([round(['b']), round(['b'])]);
    expect(sitOutBlockReason(params(g, 'b'))).toBe('consecutive');
    expect(sitOutBlockReason(params(game([round(['b'])]), 'b'))).toBeNull();
  });
  it('blocks sit-outs when kreuz is trump', () => {
    expect(sitOutBlockReason(params(game([]), 'b', [], 'kreuz'))).toBe('kreuz');
  });
  it('declarer can never sit out', () => {
    expect(sitOutBlockReason(params(game([]), 'a'))).toBe('declarer');
  });
  it('max two players sit out per round', () => {
    expect(sitOutBlockReason(params(game([]), 'd', ['b', 'c']))).toBe('limitReached');
    expect(sitOutBlockReason(params(game([]), 'c', ['b', 'c']))).toBeNull();
  });
  it('keeps at least two active players', () => {
    const three: Game = { ...game([]), playerIds: ['a', 'b', 'c'] };
    expect(sitOutBlockReason(params(three, 'c', ['b']))).toBe('tooFewPlayers');
  });
});

describe('round helpers', () => {
  it('validates the trick sum', () => {
    const r = round(['d']);
    r.entries[0].tricks = 3;
    r.entries[1].tricks = 2;
    expect(tricksValid(r.entries)).toBe(true);
    r.entries[3].tricks = 1; // sitting out, ignored
    expect(tricksValid(r.entries)).toBe(true);
    r.entries[2].tricks = 1;
    expect(tricksValid(r.entries)).toBe(false);
  });
  it('play order starts at declarer, clockwise, skipping sit-outs', () => {
    expect(playOrder(['a', 'b', 'c', 'd'], 'c', ['a'])).toEqual(['c', 'd', 'b']);
  });
});

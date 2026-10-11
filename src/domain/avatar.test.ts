import { describe, expect, it } from 'vitest';
import { AVATAR_EMOJIS, assignMissingAvatars, emojiOf, hueOf, nextFreeEmoji, pickEmoji } from './avatar';
import type { Player } from './types';

const player = (id: string, extra: Partial<Player> = {}): Player => ({ id, name: id, createdAt: Number(id.length), ...extra });

describe('avatars', () => {
  it('picks an emoji that nobody uses yet', () => {
    const players = AVATAR_EMOJIS.slice(0, 23).map((e, i) => player(`p${i}`, { emoji: e }));
    expect(pickEmoji(players)).toBe(AVATAR_EMOJIS[23]);
  });
  it('ignores archived players when checking for duplicates', () => {
    const players = [player('a', { emoji: '🦊', archived: true })];
    const picks = new Set(Array.from({ length: 200 }, () => pickEmoji(players)));
    expect(picks.has('🦊')).toBe(true);
  });
  it('cycles to the next free emoji', () => {
    const players = [player('a', { emoji: AVATAR_EMOJIS[1] })];
    expect(nextFreeEmoji(players, AVATAR_EMOJIS[0])).toBe(AVATAR_EMOJIS[2]);
    expect(nextFreeEmoji([], AVATAR_EMOJIS[23])).toBe(AVATAR_EMOJIS[0]);
  });
  it('assigns unique emojis to players that have none', () => {
    const players = ['a', 'bb', 'ccc', 'dddd'].map((id) => player(id));
    const result = assignMissingAvatars(players);
    expect(new Set(result.map((p) => p.emoji)).size).toBe(4);
    expect(result.every((p) => AVATAR_EMOJIS.includes(p.emoji!))).toBe(true);
  });
  it('keeps existing emojis and returns the same array when nothing is missing', () => {
    const players = [player('a', { emoji: '🐼' }), player('b', { emoji: '🐸' })];
    expect(assignMissingAvatars(players)).toBe(players);
    const mixed = assignMissingAvatars([player('a', { emoji: '🐼' }), player('bb')]);
    expect(mixed[0].emoji).toBe('🐼');
    expect(mixed[1].emoji).not.toBe('🐼');
  });
  it('falls back to a stable emoji and derives a stable hue', () => {
    expect(emojiOf({ id: 'x' })).toBe(emojiOf({ id: 'x' }));
    expect(hueOf('🦊')).toBe(hueOf('🦊'));
    expect(hueOf(AVATAR_EMOJIS[0])).not.toBe(hueOf(AVATAR_EMOJIS[1]));
  });
});

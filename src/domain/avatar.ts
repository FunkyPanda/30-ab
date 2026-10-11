import type { Player } from './types';

/** Animal emojis that render consistently on Android and iOS. */
export const AVATAR_EMOJIS = [
  '🦊', '🐼', '🐸', '🦁', '🐯', '🐵', '🐙', '🦄',
  '🐧', '🐨', '🐰', '🐻', '🐶', '🐱', '🦉', '🐢',
  '🦋', '🐝', '🐞', '🦈', '🐬', '🦖', '🐳', '🦀',
];

const GOLDEN_ANGLE = 137.508;

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** The player's emoji; players created before avatars existed get a stable fallback from their id. */
export function emojiOf(player: Pick<Player, 'id' | 'emoji'>): string {
  return player.emoji ?? AVATAR_EMOJIS[hash(player.id) % AVATAR_EMOJIS.length];
}

/** Background hue for an emoji. The golden angle keeps neighbouring emojis visibly different. */
export function hueOf(emoji: string): number {
  const index = AVATAR_EMOJIS.indexOf(emoji);
  return Math.round(((index >= 0 ? index : hash(emoji)) * GOLDEN_ANGLE) % 360);
}

/** Emojis already taken by active players (optionally ignoring one player). */
export function usedEmojis(players: Player[], exceptId?: string): Set<string> {
  return new Set(players.filter((p) => !p.archived && p.id !== exceptId).map(emojiOf));
}

/** A random emoji that no active player uses yet (any emoji once all are taken). */
export function pickEmoji(players: Player[], random: () => number = Math.random): string {
  const used = usedEmojis(players);
  const free = AVATAR_EMOJIS.filter((e) => !used.has(e));
  const pool = free.length > 0 ? free : AVATAR_EMOJIS;
  return pool[Math.floor(random() * pool.length)];
}

/** The next free emoji after `current`, used to cycle through options in the add form. */
export function nextFreeEmoji(players: Player[], current: string): string {
  const used = usedEmojis(players);
  const start = Math.max(0, AVATAR_EMOJIS.indexOf(current));
  for (let step = 1; step <= AVATAR_EMOJIS.length; step++) {
    const candidate = AVATAR_EMOJIS[(start + step) % AVATAR_EMOJIS.length];
    if (!used.has(candidate)) return candidate;
  }
  return current;
}

/**
 * Gives every active player without an emoji a unique one (oldest players first).
 * Returns the same array when nothing changes.
 */
export function assignMissingAvatars(players: Player[], random: () => number = Math.random): Player[] {
  if (players.every((p) => p.emoji || p.archived)) return players;
  const result = [...players];
  const order = result.map((_, i) => i).sort((a, b) => result[a].createdAt - result[b].createdAt);
  for (const i of order) {
    if (result[i].emoji || result[i].archived) continue;
    result[i] = { ...result[i], emoji: pickEmoji(result.filter((p) => p.emoji), random) };
  }
  return result;
}

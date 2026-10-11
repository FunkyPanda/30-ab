import { currentScores, ranking, winners } from '../domain/scoring';
import type { Game, Player } from '../domain/types';
import { formatScore } from '../i18n/de';

/** Builds a German, chat-friendly summary of the game. */
export function buildShareText(game: Game, players: Player[]): string {
  const scores = currentScores(game);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  const date = new Date(game.finishedAt ?? Date.now()).toLocaleDateString('de-DE');
  const title = game.status === 'finished' ? 'Endstand' : 'Zwischenstand';
  const medals = ['🥇', '🥈', '🥉'];

  // Equal scores share the same place.
  let place = 0;
  let lastScore: number | null = null;
  const lines = ranking(scores).map((id, i) => {
    if (scores[id] !== lastScore) place = i;
    lastScore = scores[id];
    const prefix = medals[place] ?? `${place + 1}.`;
    return `${prefix} ${name(id)}: ${formatScore(scores[id])}`;
  });

  const footer = [`Runden: ${game.rounds.length}`];
  if (game.status === 'finished') footer.unshift(`🏆 ${winners(scores).map(name).join(' & ')}`);
  return [`🃏 30-Ab – ${title} (${date})`, '', ...lines, '', ...footer].join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'failed';

/** Uses the native share sheet if available, otherwise copies to the clipboard. */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

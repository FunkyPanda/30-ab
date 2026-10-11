import { useState, type ReactNode } from 'react';
import { currentScores, syncStatus, winners } from '../../domain/scoring';
import type { Correction, Game } from '../../domain/types';
import { de, formatScore, suitSymbol } from '../../i18n/de';
import { navigate, replaceRoute } from '../../router';
import { buildShareText, shareText } from '../../share/shareResult';
import { useStore } from '../../store';
import {
  Button,
  Card,
  DeltaBadge,
  IconButton,
  Screen,
  SectionTitle,
  Sheet,
  SheetActions,
  ShareIcon,
  Stepper,
  useToast,
} from '../components/ui';

export default function GameScreen({ gameId }: { gameId: string }) {
  const { data, updateGame, update, playerName } = useStore();
  const [toast, showToast] = useToast();
  const [correcting, setCorrecting] = useState<string | null>(null);
  const game = data.games.find((g) => g.id === gameId);

  if (!game) {
    return (
      <Screen title="30-Ab" back="/">
        <p className="py-8 text-center text-muted">{de.game.notFound}</p>
      </Screen>
    );
  }

  const scores = currentScores(game);
  const lastRound = game.rounds[game.rounds.length - 1];
  const winnerIds = winners(scores);
  const finished = game.status === 'finished';
  const shareContent = () => buildShareText(game, data.players);

  async function onShare() {
    const result = await shareText(shareContent());
    if (result === 'copied') showToast(de.game.copied);
    if (result === 'failed') showToast(de.game.shareFailed);
  }

  function addCorrection(c: Correction) {
    updateGame(gameId, (g) => syncStatus({ ...g, corrections: [...g.corrections, c] }));
  }

  function removeCorrection(c: Correction) {
    if (!confirm(de.game.deleteCorrection)) return;
    updateGame(gameId, (g) => syncStatus({ ...g, corrections: g.corrections.filter((x) => x !== c) }));
  }

  function endGame() {
    if (!confirm(de.game.endGameConfirm)) return;
    updateGame(gameId, (g) => ({ ...g, status: 'finished', finishedAt: Date.now(), endedManually: true }));
  }

  function reopen() {
    updateGame(gameId, (g) => ({ ...g, status: 'running', finishedAt: undefined, endedManually: false }));
  }

  function deleteGame() {
    if (!confirm(de.home.deleteGame)) return;
    replaceRoute('/');
    update((d) => ({ ...d, games: d.games.filter((g) => g.id !== gameId) }));
  }

  return (
    <Screen
      title={finished ? de.game.finished : de.game.round(game.rounds.length + 1)}
      back="/"
      action={
        // A finished game has the large share button in the result banner instead.
        !finished && (
          <IconButton label={de.game.shareCurrent} onClick={onShare}>
            <ShareIcon />
          </IconButton>
        )
      }
      footer={
        !finished && (
          <Button variant="primary" className="h-14 w-full text-lg" onClick={() => navigate(`/game/${gameId}/round`)}>
            {de.game.newRound}
          </Button>
        )
      }
    >
      {finished && (
        <div className="mb-4 rounded-2xl bg-ink p-5 text-paper">
          <p className="text-sm opacity-70">{de.game.finished}</p>
          <p className="mt-1 text-2xl font-bold">🏆 {winnerIds.map(playerName).join(' & ')}</p>
          <button
            onClick={onShare}
            className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-paper/15 px-4 text-lg font-medium text-paper active:scale-[0.98]"
          >
            <ShareIcon /> {de.game.share}
          </button>
        </div>
      )}

      <div className="grid gap-2">
        {game.playerIds.map((id) => {
          const leading = winnerIds.includes(id) && game.rounds.length > 0;
          const lastEntry = lastRound?.entries.find((e) => e.playerId === id);
          return (
            <Card
              key={id}
              onClick={() => setCorrecting(id)}
              className={`flex items-center gap-3 ${leading ? 'border-ink' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {leading && <span className="mr-1">{finished ? '🏆' : '👑'}</span>}
                  {playerName(id)}
                </p>
                {lastEntry && (
                  <p className="text-sm text-muted">
                    {lastEntry.sittingOut ? de.game.sittingOut : <DeltaBadge delta={lastEntry.delta} />}
                    {lastRound.declarerId === id && ` · ${suitSymbol[lastRound.trump]}`}
                  </p>
                )}
              </div>
              <span className={`text-4xl font-bold tabular-nums ${scores[id] <= 0 ? 'text-good' : ''}`}>
                {formatScore(scores[id])}
              </span>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted">{de.game.tapToCorrect}</p>

      <SectionTitle>{de.game.history}</SectionTitle>
      {game.rounds.length === 0 && game.corrections.length === 0 ? (
        <p className="py-4 text-center text-muted">{de.game.noRounds}</p>
      ) : (
        <div className="grid gap-2">{historyItems(game, playerName, removeCorrection)}</div>
      )}

      <div className="mt-8 grid gap-2">
        {!finished && game.rounds.length > 0 && (
          <Button variant="ghost" onClick={endGame}>
            {de.game.endGame}
          </Button>
        )}
        {finished && game.endedManually && (
          <Button variant="ghost" onClick={reopen}>
            {de.game.reopen}
          </Button>
        )}
        <Button variant="danger" onClick={deleteGame}>
          {de.game.deleteGame}
        </Button>
      </div>

      <CorrectionSheet
        playerId={correcting}
        name={correcting ? playerName(correcting) : ''}
        current={correcting ? scores[correcting] : 0}
        afterRound={game.rounds.length}
        onClose={() => setCorrecting(null)}
        onSave={addCorrection}
      />
      {toast}
    </Screen>
  );
}

/** Rounds and corrections, newest first. */
function historyItems(game: Game, playerName: (id: string) => string, onRemoveCorrection: (c: Correction) => void): ReactNode[] {
  const items: ReactNode[] = [];
  for (let i = game.rounds.length; i >= 0; i--) {
    game.corrections
      .filter((c) => c.afterRound === i)
      .reverse()
      .forEach((c) =>
        items.push(
          <div key={`c-${c.createdAt}`} className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-sm">
            <span className="text-muted">{de.game.correction}</span>
            <span className="font-medium">{playerName(c.playerId)}</span>
            <DeltaBadge delta={c.delta} />
            <span className="flex-1 truncate text-muted">{c.note}</span>
            <button className="text-muted hover:text-bad" onClick={() => onRemoveCorrection(c)} aria-label={de.game.delete}>
              ✕
            </button>
          </div>,
        ),
      );
    if (i === 0) break;
    const round = game.rounds[i - 1];
    items.push(
      <Card key={`r-${i}`} onClick={() => navigate(`/game/${game.id}/round/${i - 1}`)}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{de.game.round(i)}</span>
          <span className="text-muted">
            <span className={round.trump === 'herz' || round.trump === 'karo' ? 'text-accent' : ''}>
              {suitSymbol[round.trump]} {de.suits[round.trump]}
            </span>
            {' · '}
            {playerName(round.declarerId)} · {de.game.bid(round.bid)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {round.entries.map((e) => (
            <div key={e.playerId} className="flex justify-between gap-2">
              <span className="truncate text-muted">{playerName(e.playerId)}</span>
              {e.sittingOut ? (
                <span className="text-muted">–</span>
              ) : (
                <span>
                  <span className="mr-2 text-xs text-muted">{e.tricks}×</span>
                  <DeltaBadge delta={e.delta} />
                  {e.delta !== e.calculatedDelta && <span className="ml-1 text-xs text-muted">✎</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>,
    );
  }
  return items;
}

function CorrectionSheet({
  playerId,
  name,
  current,
  afterRound,
  onClose,
  onSave,
}: {
  playerId: string | null;
  name: string;
  current: number;
  afterRound: number;
  onClose: () => void;
  onSave: (c: Correction) => void;
}) {
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState('');
  const close = () => {
    setDelta(0);
    setNote('');
    onClose();
  };
  return (
    <Sheet open={!!playerId} onClose={close} title={de.game.correctionFor(name)}>
      <p className="mb-2 text-center text-sm text-muted">{de.game.correctionDelta}</p>
      <Stepper value={delta} onChange={setDelta} min={-99} max={99} />
      <p className="mt-3 text-center text-muted">
        {formatScore(current)} → <span className="font-semibold text-ink">{formatScore(current + delta)}</span>
      </p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={de.game.note}
        className="mt-4 min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-ink"
        maxLength={60}
      />
      <SheetActions
        primary={
          <Button
            variant="primary"
            className="h-14 w-full text-lg"
            disabled={delta === 0}
            onClick={() => {
              if (!playerId) return;
              onSave({ playerId, delta, note: note.trim() || undefined, afterRound, createdAt: Date.now() });
              close();
            }}
          >
            {de.game.save}
          </Button>
        }
      >
        <Button className="w-full" onClick={close}>
          {de.game.cancel}
        </Button>
      </SheetActions>
    </Sheet>
  );
}

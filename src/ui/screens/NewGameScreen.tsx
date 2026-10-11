import { useState } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../domain/rules';
import type { Game } from '../../domain/types';
import { de } from '../../i18n/de';
import { navigate, replaceRoute } from '../../router';
import { newId } from '../../storage/repository';
import { useStore } from '../../store';
import { ArrowDownIcon, ArrowUpIcon, Button, IconButton, Screen, SectionTitle, Stepper } from '../components/ui';

const DEFAULT_START_SCORE = 30;

export default function NewGameScreen() {
  const { activePlayers, update, playerName } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [startScore, setStartScore] = useState(DEFAULT_START_SCORE);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_PLAYERS ? [...s, id] : s));
  }

  function move(index: number, dir: -1 | 1) {
    setSelected((s) => {
      const next = [...s];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });
  }

  function start() {
    const game: Game = {
      id: newId(),
      playerIds: selected,
      startScore,
      rounds: [],
      corrections: [],
      status: 'running',
      createdAt: Date.now(),
    };
    update((d) => ({ ...d, games: [...d.games, game] }));
    // Replace history entry so "back" from the game leads home, not to this form.
    replaceRoute(`/game/${game.id}`);
  }

  if (activePlayers.length < MIN_PLAYERS) {
    return (
      <Screen title={de.newGame.title} back="/">
        <p className="py-8 text-center text-muted">{de.newGame.needPlayers}</p>
        <Button variant="primary" className="w-full" onClick={() => navigate('/players')}>
          {de.newGame.managePlayers}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen
      title={de.newGame.title}
      back="/"
      footer={
        <Button variant="primary" className="h-14 w-full text-lg" disabled={selected.length < MIN_PLAYERS} onClick={start}>
          {de.newGame.start}
        </Button>
      }
    >
      <SectionTitle>{de.newGame.selectPlayers}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {activePlayers.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              disabled={!on && selected.length >= MAX_PLAYERS}
              className={`min-h-12 rounded-full border px-5 text-base transition disabled:opacity-40 ${
                on ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <>
          <SectionTitle>{de.newGame.seatOrder}</SectionTitle>
          <p className="mb-2 text-sm text-muted">{de.newGame.seatHint}</p>
          <ol className="grid gap-2">
            {selected.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-4">
                <span className="w-6 text-muted tabular-nums">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-lg font-medium">{playerName(id)}</span>
                <IconButton label="Nach oben" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUpIcon />
                </IconButton>
                <IconButton label="Nach unten" disabled={i === selected.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDownIcon />
                </IconButton>
              </li>
            ))}
          </ol>
        </>
      )}

      <SectionTitle>{de.newGame.startScore}</SectionTitle>
      <div className="rounded-2xl border border-line bg-surface py-4">
        <Stepper value={startScore} onChange={setStartScore} min={5} max={99} size="md" />
      </div>
    </Screen>
  );
}

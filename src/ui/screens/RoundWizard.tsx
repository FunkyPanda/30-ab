import { useState } from 'react';
import { playOrder, sitOutBlockReason, totalTricks } from '../../domain/rules';
import { calcDelta, currentScores, MAX_BID, syncStatus, TRICKS_PER_ROUND } from '../../domain/scoring';
import type { Game, Round, RoundEntry, Suit } from '../../domain/types';
import { de, formatDelta, formatScore, SUITS, suitSymbol } from '../../i18n/de';
import { goBack } from '../../router';
import { useStore } from '../../store';
import { Button, DeltaBadge, Screen, Sheet, Stepper } from '../components/ui';

type Step = { kind: 'bid' } | { kind: 'sitOut' } | { kind: 'tricks'; playerId: string } | { kind: 'summary' };

export default function RoundWizard({ gameId, editIndex }: { gameId: string; editIndex?: number }) {
  const { data, updateGame } = useStore();
  const game = data.games.find((g) => g.id === gameId);
  const existing = editIndex !== undefined ? game?.rounds[editIndex] : undefined;

  if (!game || (editIndex !== undefined && !existing)) {
    return (
      <Screen title="30-Ab" back={`/game/${gameId}`}>
        <p className="py-8 text-center text-muted">{de.game.notFound}</p>
      </Screen>
    );
  }
  return <Wizard game={game} existing={existing} editIndex={editIndex} onSave={(g) => updateGame(gameId, () => g)} />;
}

function Wizard({
  game,
  existing,
  editIndex,
  onSave,
}: {
  game: Game;
  existing?: Round;
  editIndex?: number;
  onSave: (game: Game) => void;
}) {
  const { playerName } = useStore();
  const roundIndex = editIndex ?? game.rounds.length;

  const [declarerId, setDeclarerId] = useState<string | null>(existing?.declarerId ?? null);
  const [bid, setBid] = useState(existing?.bid ?? 2);
  const [trump, setTrump] = useState<Suit | null>(existing?.trump ?? null);
  const [sittingOut, setSittingOut] = useState<string[]>(
    existing?.entries.filter((e) => e.sittingOut).map((e) => e.playerId) ?? [],
  );
  const [tricks, setTricks] = useState<Record<string, number>>(
    Object.fromEntries(existing?.entries.map((e) => [e.playerId, e.tricks]) ?? []),
  );
  const [overrides, setOverrides] = useState<Record<string, number>>(
    Object.fromEntries(existing?.entries.filter((e) => e.delta !== e.calculatedDelta).map((e) => [e.playerId, e.delta]) ?? []),
  );
  const [stepIndex, setStepIndex] = useState(existing ? -1 : 0); // -1 = jump to summary once steps are known
  const [overriding, setOverriding] = useState<string | null>(null);

  const blockReason = (playerId: string) =>
    declarerId && trump
      ? sitOutBlockReason({ game, playerId, declarerId, trump, currentlyOut: sittingOut, roundIndex })
      : 'declarer';
  const canAnyoneSitOut = declarerId !== null && game.playerIds.some((id) => sittingOut.includes(id) || !blockReason(id));
  const order = declarerId ? playOrder(game.playerIds, declarerId, sittingOut) : [];

  const steps: Step[] = [
    { kind: 'bid' },
    ...(canAnyoneSitOut ? [{ kind: 'sitOut' } as const] : []),
    ...order.map((playerId) => ({ kind: 'tricks', playerId }) as const),
    { kind: 'summary' },
  ];
  const currentIndex = stepIndex === -1 ? steps.length - 1 : Math.min(stepIndex, steps.length - 1);
  const step = steps[currentIndex];

  const tricksOf = (id: string) => (sittingOut.includes(id) ? 0 : (tricks[id] ?? 0));
  const activeEntries = order.map((id) => ({ sittingOut: false, tricks: tricksOf(id) }) as RoundEntry);
  const sum = totalTricks(activeEntries);
  const remaining = TRICKS_PER_ROUND - sum;

  function entryFor(playerId: string): RoundEntry {
    const out = sittingOut.includes(playerId);
    const t = tricksOf(playerId);
    const calculatedDelta = calcDelta({ isDeclarer: playerId === declarerId, sittingOut: out, tricks: t, bid, trump: trump! });
    return { playerId, sittingOut: out, tricks: t, calculatedDelta, delta: overrides[playerId] ?? calculatedDelta };
  }

  function next() {
    const nextStep = steps[currentIndex + 1];
    // Convenience: pre-fill the last player's tricks with what is left over.
    if (nextStep?.kind === 'tricks' && nextStep.playerId === order[order.length - 1] && tricks[nextStep.playerId] === undefined) {
      setTricks((t) => ({ ...t, [nextStep.playerId]: Math.max(0, remaining) }));
    }
    setStepIndex(currentIndex + 1);
  }

  function back() {
    if (currentIndex === 0) goBack(`/game/${game.id}`);
    else setStepIndex(currentIndex - 1);
  }

  function chooseTrump(s: Suit) {
    setTrump(s);
    if (s === 'kreuz') setSittingOut([]);
  }

  function chooseDeclarer(id: string) {
    setDeclarerId(id);
    setSittingOut((out) => out.filter((x) => x !== id));
  }

  function save() {
    const round: Round = { declarerId: declarerId!, bid, trump: trump!, entries: game.playerIds.map(entryFor) };
    const rounds = [...game.rounds];
    if (editIndex !== undefined) rounds[editIndex] = round;
    else rounds.push(round);
    onSave(syncStatus({ ...game, rounds }));
    goBack(`/game/${game.id}`);
  }

  function deleteRound() {
    if (editIndex === undefined || !confirm(de.game.deleteRound)) return;
    const rounds = game.rounds.filter((_, i) => i !== editIndex);
    // Corrections made after the deleted round move one round earlier so they stay in place.
    const corrections = game.corrections.map((c) => (c.afterRound > editIndex ? { ...c, afterRound: c.afterRound - 1 } : c));
    onSave(syncStatus({ ...game, rounds, corrections }));
    goBack(`/game/${game.id}`);
  }

  const title = existing ? de.wizard.editRound(roundIndex + 1) : de.wizard.newRound(roundIndex + 1);
  const isLast = step.kind === 'summary';
  const nextDisabled =
    (step.kind === 'bid' && (!declarerId || !trump)) || (step.kind === 'summary' && sum !== TRICKS_PER_ROUND);

  return (
    <Screen
      title={title}
      back={back}
      action={
        existing && (
          <Button variant="danger" className="px-3" onClick={deleteRound}>
            {de.game.delete}
          </Button>
        )
      }
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={back}>
            {currentIndex === 0 ? de.wizard.cancel : de.wizard.back}
          </Button>
          <Button variant="primary" className="h-14 flex-1 text-lg" disabled={nextDisabled} onClick={isLast ? save : next}>
            {isLast ? de.wizard.save : de.wizard.next}
          </Button>
        </div>
      }
    >
      {/* Progress dots */}
      <div className="mb-6 flex gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= currentIndex ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>

      {step.kind === 'bid' && (
        <div className="grid gap-6">
          <section>
            <h2 className="mb-3 font-medium">{de.wizard.declarer}</h2>
            <div className="grid grid-cols-2 gap-2">
              {game.playerIds.map((id) => (
                <button
                  key={id}
                  onClick={() => chooseDeclarer(id)}
                  className={`min-h-14 rounded-2xl border px-3 font-medium transition ${
                    declarerId === id ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
                  }`}
                >
                  {playerName(id)}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-medium">{de.wizard.bid}</h2>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: MAX_BID }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setBid(n)}
                  className={`h-14 rounded-2xl border text-xl font-semibold tabular-nums transition ${
                    bid === n ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-medium">{de.wizard.trump}</h2>
            <div className="grid grid-cols-4 gap-2">
              {SUITS.map((s) => {
                const red = s === 'herz' || s === 'karo';
                return (
                  <button
                    key={s}
                    onClick={() => chooseTrump(s)}
                    className={`flex h-20 flex-col items-center justify-center rounded-2xl border transition ${
                      trump === s ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
                    }`}
                  >
                    <span className={`text-3xl leading-none ${red && trump !== s ? 'text-accent' : ''}`}>{suitSymbol[s]}</span>
                    <span className="mt-1 text-xs">{de.suits[s]}</span>
                  </button>
                );
              })}
            </div>
            {trump === 'herz' && <p className="mt-3 rounded-xl bg-bad/10 p-3 text-sm text-bad">♥ {de.wizard.herzHint}</p>}
            {trump === 'kreuz' && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">♣ {de.wizard.kreuzHint}</p>}
          </section>
        </div>
      )}

      {step.kind === 'sitOut' && (
        <section>
          <h2 className="mb-1 font-medium">{de.wizard.sitOutQuestion}</h2>
          <p className="mb-4 text-sm text-muted">{de.wizard.sitOutHint}</p>
          <div className="grid gap-2">
            {game.playerIds.map((id) => {
              const out = sittingOut.includes(id);
              const reason = out ? null : blockReason(id);
              return (
                <button
                  key={id}
                  disabled={!!reason}
                  onClick={() => setSittingOut((s) => (out ? s.filter((x) => x !== id) : [...s, id]))}
                  className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition disabled:opacity-50 ${
                    out ? 'border-dashed border-muted bg-surface-2' : 'border-line bg-surface'
                  }`}
                >
                  <span className={`font-medium ${out ? 'text-muted line-through' : ''}`}>{playerName(id)}</span>
                  <span className="text-sm text-muted">{reason ? de.wizard.blocked[reason] : out ? de.wizard.sitsOut : de.wizard.plays}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step.kind === 'tricks' && (
        <TricksStep
          name={playerName(step.playerId)}
          isDeclarer={step.playerId === declarerId}
          bid={bid}
          value={tricksOf(step.playerId)}
          max={tricksOf(step.playerId) + Math.max(0, remaining)}
          remaining={remaining}
          delta={entryFor(step.playerId).calculatedDelta}
          herz={trump === 'herz'}
          onChange={(v) => {
            setTricks((t) => ({ ...t, [step.playerId]: v }));
            setOverrides(({ [step.playerId]: _, ...rest }) => rest);
          }}
        />
      )}

      {step.kind === 'summary' && (
        <Summary
          game={game}
          roundIndex={roundIndex}
          entries={game.playerIds.map(entryFor)}
          declarerId={declarerId!}
          sum={sum}
          onOverride={setOverriding}
        />
      )}

      <OverrideSheet
        playerId={overriding}
        name={overriding ? playerName(overriding) : ''}
        calculated={overriding ? entryFor(overriding).calculatedDelta : 0}
        value={overriding ? entryFor(overriding).delta : 0}
        onClose={() => setOverriding(null)}
        onSave={(id, v) => {
          setOverrides((o) => {
            const { [id]: _, ...rest } = o;
            return v === entryFor(id).calculatedDelta ? rest : { ...rest, [id]: v };
          });
          setOverriding(null);
        }}
      />
    </Screen>
  );
}

function TricksStep(props: {
  name: string;
  isDeclarer: boolean;
  bid: number;
  value: number;
  max: number;
  remaining: number;
  delta: number;
  herz: boolean;
  onChange: (v: number) => void;
}) {
  const { name, isDeclarer, bid, value, max, remaining, delta, herz, onChange } = props;
  return (
    <section className="flex flex-col items-center pt-4 text-center">
      <p className="text-3xl font-bold">{name}</p>
      {isDeclarer && <p className="mt-1 text-sm text-muted">{de.wizard.declarerBid(bid)}</p>}
      <h2 className="mt-6 mb-6 text-muted">{de.wizard.tricksFor(name)}</h2>
      <Stepper value={value} onChange={onChange} min={0} max={Math.min(TRICKS_PER_ROUND, max)} />
      <div className="mt-8 flex items-center gap-2 text-2xl">
        <DeltaBadge delta={delta} />
        {herz && <span className="rounded-full bg-bad/10 px-2 py-0.5 text-xs text-bad">♥ ×2</span>}
      </div>
      <p className={`mt-6 text-sm ${remaining < 0 ? 'text-bad' : 'text-muted'}`}>
        {remaining >= 0 ? de.wizard.remaining(remaining) : de.wizard.tooMany(-remaining)}
      </p>
    </section>
  );
}

function Summary({
  game,
  roundIndex,
  entries,
  declarerId,
  sum,
  onOverride,
}: {
  game: Game;
  roundIndex: number;
  entries: RoundEntry[];
  declarerId: string;
  sum: number;
  onOverride: (id: string) => void;
}) {
  const { playerName } = useStore();
  const before = currentScores(game, roundIndex);
  return (
    <section>
      {sum !== TRICKS_PER_ROUND && <p className="mb-4 rounded-xl bg-bad/10 p-3 text-sm text-bad">{de.wizard.sumError(sum)}</p>}
      <div className="grid gap-2">
        {entries.map((e) => (
          <div key={e.playerId} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {playerName(e.playerId)}
                {e.playerId === declarerId && <span className="ml-2 text-xs text-muted">★</span>}
              </p>
              <p className="text-sm text-muted">{e.sittingOut ? de.game.sittingOut : de.game.tricks(e.tricks)}</p>
            </div>
            <button
              onClick={() => onOverride(e.playerId)}
              className="min-w-16 rounded-xl px-2 py-1 text-right text-xl hover:bg-surface-2"
            >
              <DeltaBadge delta={e.delta} />
              {e.delta !== e.calculatedDelta && <span className="block text-[10px] text-muted">{de.game.manual}</span>}
            </button>
            <span className="w-14 text-right text-2xl font-bold tabular-nums">{formatScore(before[e.playerId] + e.delta)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">{de.wizard.overrideHint}</p>
    </section>
  );
}

function OverrideSheet({
  playerId,
  name,
  calculated,
  value,
  onClose,
  onSave,
}: {
  playerId: string | null;
  name: string;
  calculated: number;
  value: number;
  onClose: () => void;
  onSave: (id: string, value: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const current = draft ?? value;
  const close = () => {
    setDraft(null);
    onClose();
  };
  return (
    <Sheet open={!!playerId} onClose={close} title={de.wizard.overridePrompt(name)}>
      <Stepper value={current} onChange={setDraft} min={-99} max={99} />
      <div className="mt-6 flex gap-2">
        <Button variant="ghost" onClick={() => setDraft(calculated)} disabled={current === calculated}>
          ↺ {de.wizard.reset} ({formatDelta(calculated)})
        </Button>
        <span className="flex-1" />
        <Button
          variant="primary"
          onClick={() => {
            if (playerId) onSave(playerId, current);
            setDraft(null);
          }}
        >
          {de.game.save}
        </Button>
      </div>
    </Sheet>
  );
}

import { useState } from 'react';
import { AVATAR_EMOJIS, emojiOf, nextFreeEmoji, pickEmoji, usedEmojis } from '../../domain/avatar';
import type { Player } from '../../domain/types';
import { de } from '../../i18n/de';
import { newId } from '../../storage/repository';
import { useStore } from '../../store';
import { Avatar } from '../components/Avatar';
import { Button, Card, Screen, Sheet, SheetActions } from '../components/ui';

export default function PlayersScreen() {
  const { activePlayers, data, update } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [newEmoji, setNewEmoji] = useState(() => pickEmoji(data.players));
  const [editing, setEditing] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const nameTaken = (n: string, exceptId?: string) =>
    data.players.some((p) => !p.archived && p.id !== exceptId && p.name.toLowerCase() === n.trim().toLowerCase());

  function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (nameTaken(trimmed)) return setError(de.players.duplicate);
    const player: Player = { id: newId(), name: trimmed, emoji: newEmoji, createdAt: Date.now() };
    update((d) => ({ ...d, players: [...d.players, player] }));
    setName('');
    setError('');
    setNewEmoji(pickEmoji([...data.players, player]));
  }

  function openEditor(player: Player) {
    setEditing(player);
    setEditName(player.name);
    setEditEmoji(emojiOf(player));
  }

  function saveEdit() {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed || nameTaken(trimmed, editing.id)) return;
    update((d) => ({
      ...d,
      players: d.players.map((p) => (p.id === editing.id ? { ...p, name: trimmed, emoji: editEmoji } : p)),
    }));
    setEditing(null);
  }

  function remove(player: Player) {
    if (!confirm(de.players.removeConfirm(player.name))) return;
    // Archive instead of delete so that old games and stats keep their names.
    update((d) => ({ ...d, players: d.players.map((p) => (p.id === player.id ? { ...p, archived: true } : p)) }));
    setEditing(null);
  }

  const takenByOthers = usedEmojis(data.players, editing?.id);

  return (
    <Screen title={de.players.title} back="/">
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addPlayer();
        }}
      >
        <button
          type="button"
          onClick={() => setNewEmoji((current) => nextFreeEmoji(data.players, current))}
          aria-label={de.players.otherIcon}
          title={de.players.otherIcon}
          className="shrink-0 rounded-full transition active:scale-95"
        >
          <Avatar emoji={newEmoji} size="lg" />
        </button>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder={de.players.placeholder}
          className="min-h-14 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-ink"
          maxLength={24}
        />
        <Button variant="primary" type="submit" className="min-h-14 shrink-0 px-5" disabled={!name.trim()}>
          {de.players.add}
        </Button>
      </form>
      {error ? (
        <p className="-mt-2 mb-3 text-sm text-bad">{error}</p>
      ) : (
        <p className="-mt-2 mb-4 text-sm text-muted">{de.players.iconHint}</p>
      )}

      {activePlayers.length === 0 ? (
        <p className="py-8 text-center text-muted">{de.players.empty}</p>
      ) : (
        <div className="grid gap-2">
          {activePlayers.map((p) => (
            <Card key={p.id} onClick={() => openEditor(p)} className="flex items-center gap-3">
              <Avatar emoji={emojiOf(p)} size="lg" />
              <span className="min-w-0 flex-1 truncate text-lg font-medium">{p.name}</span>
              <span className="text-muted">✎</span>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={de.players.edit}>
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-ink"
          maxLength={24}
        />
        <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{de.players.chooseIcon}</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map((e) => {
            const selected = e === editEmoji;
            const taken = takenByOthers.has(e);
            return (
              <button
                key={e}
                type="button"
                disabled={taken}
                onClick={() => setEditEmoji(e)}
                aria-label={e}
                aria-pressed={selected}
                className={`grid aspect-square place-items-center rounded-2xl text-2xl transition active:scale-95 disabled:opacity-25 ${
                  selected ? 'bg-ink/10 ring-2 ring-ink' : 'bg-surface-2'
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
        <SheetActions
          primary={
            <Button
              variant="primary"
              className="h-14 w-full text-lg"
              onClick={saveEdit}
              disabled={!editName.trim() || nameTaken(editName, editing?.id)}
            >
              {de.game.save}
            </Button>
          }
        >
          <Button className="w-full" onClick={() => setEditing(null)}>
            {de.game.cancel}
          </Button>
          <Button variant="danger" className="w-full" onClick={() => editing && remove(editing)}>
            {de.players.remove}
          </Button>
        </SheetActions>
      </Sheet>
    </Screen>
  );
}

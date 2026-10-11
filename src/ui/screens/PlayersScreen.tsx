import { useState } from 'react';
import type { Player } from '../../domain/types';
import { de } from '../../i18n/de';
import { newId } from '../../storage/repository';
import { useStore } from '../../store';
import { Button, Card, Screen, Sheet, SheetActions } from '../components/ui';

export default function PlayersScreen() {
  const { activePlayers, data, update } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');

  const nameTaken = (n: string, exceptId?: string) =>
    data.players.some((p) => !p.archived && p.id !== exceptId && p.name.toLowerCase() === n.trim().toLowerCase());

  function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (nameTaken(trimmed)) return setError(de.players.duplicate);
    update((d) => ({ ...d, players: [...d.players, { id: newId(), name: trimmed, createdAt: Date.now() }] }));
    setName('');
    setError('');
  }

  function saveRename() {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed || nameTaken(trimmed, editing.id)) return;
    update((d) => ({ ...d, players: d.players.map((p) => (p.id === editing.id ? { ...p, name: trimmed } : p)) }));
    setEditing(null);
  }

  function remove(player: Player) {
    if (!confirm(de.players.removeConfirm(player.name))) return;
    // Archive instead of delete so that old games and stats keep their names.
    update((d) => ({ ...d, players: d.players.map((p) => (p.id === player.id ? { ...p, archived: true } : p)) }));
    setEditing(null);
  }

  return (
    <Screen title={de.players.title} back="/">
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addPlayer();
        }}
      >
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder={de.players.placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-ink"
          maxLength={24}
        />
        <Button variant="primary" type="submit" className="shrink-0 px-5" disabled={!name.trim()}>
          {de.players.add}
        </Button>
      </form>
      {error && <p className="-mt-2 mb-3 text-sm text-bad">{error}</p>}

      {activePlayers.length === 0 ? (
        <p className="py-8 text-center text-muted">{de.players.empty}</p>
      ) : (
        <div className="grid gap-2">
          {activePlayers.map((p) => (
            <Card
              key={p.id}
              onClick={() => {
                setEditing(p);
                setEditName(p.name);
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted">✎</span>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={de.players.rename}>
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-ink"
          maxLength={24}
          autoFocus
        />
        <SheetActions
          primary={
            <Button
              variant="primary"
              className="h-14 w-full text-lg"
              onClick={saveRename}
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

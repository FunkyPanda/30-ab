import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { assignMissingAvatars, emojiOf } from './domain/avatar';
import type { Game, Player } from './domain/types';
import { loadData, saveData, type AppData } from './storage/repository';

interface Store {
  data: AppData;
  /** Applies an immutable update to the app data and persists it. */
  update: (fn: (data: AppData) => AppData) => void;
  updateGame: (id: string, fn: (game: Game) => Game) => void;
  playerName: (id: string) => string;
  playerEmoji: (id: string) => string;
  /** Emoji and name for plain-text contexts, e.g. "🦊 Anna". */
  playerLabel: (id: string) => string;
  activePlayers: Player[];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Players created before avatars existed get a unique emoji once, on first load.
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData();
    const players = assignMissingAvatars(loaded.players);
    return players === loaded.players ? loaded : { ...loaded, players };
  });

  useEffect(() => saveData(data), [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const updateGame = useCallback(
    (id: string, fn: (g: Game) => Game) =>
      setData((d) => ({ ...d, games: d.games.map((g) => (g.id === id ? fn(g) : g)) })),
    [],
  );
  const find = (id: string) => data.players.find((p) => p.id === id);
  const playerName = (id: string) => find(id)?.name ?? '?';
  const playerEmoji = (id: string) => {
    const player = find(id);
    return player ? emojiOf(player) : '❔';
  };
  const playerLabel = (id: string) => `${playerEmoji(id)} ${playerName(id)}`;
  const activePlayers = data.players.filter((p) => !p.archived);

  return (
    <StoreContext.Provider value={{ data, update, updateGame, playerName, playerEmoji, playerLabel, activePlayers }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

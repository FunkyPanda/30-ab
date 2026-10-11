import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Game, Player } from './domain/types';
import { loadData, saveData, type AppData } from './storage/repository';

interface Store {
  data: AppData;
  /** Applies an immutable update to the app data and persists it. */
  update: (fn: (data: AppData) => AppData) => void;
  updateGame: (id: string, fn: (game: Game) => Game) => void;
  playerName: (id: string) => string;
  activePlayers: Player[];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => saveData(data), [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const updateGame = useCallback(
    (id: string, fn: (g: Game) => Game) =>
      setData((d) => ({ ...d, games: d.games.map((g) => (g.id === id ? fn(g) : g)) })),
    [],
  );
  const playerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? '?';
  const activePlayers = data.players.filter((p) => !p.archived);

  return (
    <StoreContext.Provider value={{ data, update, updateGame, playerName, activePlayers }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

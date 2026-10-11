import type { Game, Player } from '../domain/types';

const STORAGE_KEY = '30ab:v1';

export interface AppData {
  version: 1;
  players: Player[];
  games: Game[];
}

const empty = (): AppData => ({ version: 1, players: [], games: [] });

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return parseData(raw);
  } catch {
    return empty();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable (e.g. private mode) – nothing we can do here.
  }
}

/** Parses and minimally validates exported/stored JSON. Throws on invalid input. */
export function parseData(raw: string): AppData {
  const parsed = JSON.parse(raw);
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.players) || !Array.isArray(parsed.games)) {
    throw new Error('Invalid data format');
  }
  return parsed as AppData;
}

/** Triggers a download of all data as a JSON backup file. */
export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `30-ab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Merges imported data into existing data; entries with the same id are replaced by the imported version. */
export function mergeData(current: AppData, imported: AppData): AppData {
  const byId = <T extends { id: string }>(a: T[], b: T[]) => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return [...map.values()];
  };
  return { version: 1, players: byId(current.players, imported.players), games: byId(current.games, imported.games) };
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

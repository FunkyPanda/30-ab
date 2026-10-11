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

const SUITS = ['kreuz', 'pik', 'herz', 'karo'];
const MAX_TEXT_LENGTH = 200;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TEXT_LENGTH;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function validPlayer(p: unknown): p is Player {
  return isObj(p) && isStr(p.id) && isStr(p.name) && isNum(p.createdAt);
}

function validEntry(e: unknown): boolean {
  return (
    isObj(e) &&
    isStr(e.playerId) &&
    typeof e.sittingOut === 'boolean' &&
    isNum(e.tricks) &&
    isNum(e.calculatedDelta) &&
    isNum(e.delta)
  );
}

function validRound(r: unknown): boolean {
  return (
    isObj(r) &&
    isStr(r.declarerId) &&
    isNum(r.bid) &&
    SUITS.includes(r.trump as string) &&
    Array.isArray(r.entries) &&
    r.entries.every(validEntry)
  );
}

function validCorrection(c: unknown): boolean {
  return (
    isObj(c) &&
    isStr(c.playerId) &&
    isNum(c.delta) &&
    isNum(c.afterRound) &&
    isNum(c.createdAt) &&
    (c.note === undefined || isStr(c.note))
  );
}

function validGame(g: unknown): g is Game {
  return (
    isObj(g) &&
    isStr(g.id) &&
    isStrArray(g.playerIds) &&
    g.playerIds.length >= 2 &&
    g.playerIds.length <= 4 &&
    isNum(g.startScore) &&
    (g.status === 'running' || g.status === 'finished') &&
    isNum(g.createdAt) &&
    Array.isArray(g.rounds) &&
    g.rounds.every(validRound) &&
    Array.isArray(g.corrections) &&
    g.corrections.every(validCorrection)
  );
}

/** Parses and strictly validates exported/stored JSON. Throws on invalid input. */
export function parseData(raw: string): AppData {
  const parsed: unknown = JSON.parse(raw);
  if (
    !isObj(parsed) ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.players) ||
    !Array.isArray(parsed.games) ||
    !parsed.players.every(validPlayer) ||
    !parsed.games.every(validGame)
  ) {
    throw new Error('Invalid data format');
  }
  // Rebuild from the validated fields only, so unknown extra keys in a file are dropped.
  return { version: 1, players: parsed.players as Player[], games: parsed.games as Game[] };
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

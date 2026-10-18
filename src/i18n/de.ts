import type { SitOutBlockReason } from '../domain/rules';
import type { Suit } from '../domain/types';

/** All user-facing German strings. */
export const de = {
  home: {
    subtitle: 'Punktezähler',
    newGame: 'Neues Spiel',
    continueGame: 'Spiel fortsetzen',
    players: 'Spieler',
    stats: 'Statistik',
    settings: 'Einstellungen',
    savedGames: 'Gespeicherte Spiele',
    noGames: 'Noch keine Spiele. Leg zuerst Spieler an und starte ein neues Spiel.',
    running: 'läuft',
    finished: 'beendet',
    rounds: (n: number) => (n === 1 ? '1 Runde' : `${n} Runden`),
    backup: 'Datensicherung',
    export: 'Exportieren',
    import: 'Importieren',
    importOk: 'Daten erfolgreich importiert.',
    importFail: 'Die Datei konnte nicht gelesen werden.',
    deleteGame: 'Dieses Spiel endgültig löschen?',
  },
  players: {
    title: 'Spieler',
    placeholder: 'Name des Spielers',
    add: 'Hinzufügen',
    empty: 'Noch keine Spieler angelegt.',
    edit: 'Spieler bearbeiten',
    chooseIcon: 'Symbol wählen',
    otherIcon: 'Anderes Symbol',
    iconHint: 'Tippe auf das Symbol, um ein anderes zu wählen.',
    remove: 'Entfernen',
    removeConfirm: (name: string) => `${name} entfernen? Bisherige Spiele und Statistiken bleiben erhalten.`,
    duplicate: 'Diesen Namen gibt es schon.',
  },
  newGame: {
    title: 'Neues Spiel',
    selectPlayers: 'Spieler auswählen (2–4)',
    seatOrder: 'Sitzordnung',
    seatHint: 'Reihenfolge = Sitzordnung im Uhrzeigersinn. Mit den Pfeilen sortieren.',
    startScore: 'Startpunktzahl',
    start: 'Spiel starten',
    needPlayers: 'Lege zuerst mindestens 2 Spieler an.',
    managePlayers: 'Spieler verwalten',
  },
  game: {
    round: (n: number) => `Runde ${n}`,
    newRound: 'Neue Runde',
    history: 'Verlauf',
    noRounds: 'Noch keine Runde gespielt.',
    correctionFor: (name: string) => `Korrektur für ${name}`,
    correctionDelta: 'Änderung der Punkte',
    note: 'Notiz (optional)',
    correction: 'Korrektur',
    tapToCorrect: 'Tippe auf einen Spieler, um seine Punkte zu korrigieren.',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    deleteRound: 'Diese Runde löschen?',
    deleteGame: 'Spiel löschen',
    notFound: 'Spiel nicht gefunden.',
    deleteCorrection: 'Diese Korrektur löschen?',
    finished: 'Spiel beendet!',
    winner: (names: string) => `Gewinner: ${names}`,
    share: 'Teilen',
    shareCurrent: 'Spielstand teilen',
    copied: 'In die Zwischenablage kopiert.',
    shareFailed: 'Teilen nicht möglich.',
    endGame: 'Spiel beenden',
    endGameConfirm: 'Spiel jetzt beenden? Es gewinnt, wer die wenigsten Punkte hat.',
    reopen: 'Weiterspielen',
    sittingOut: 'setzt aus',
    tricks: (n: number) => (n === 1 ? '1 Stich' : `${n} Stiche`),
    bid: (n: number) => `${n} angesagt`,
    manual: 'manuell',
    back: 'Zurück',
  },
  wizard: {
    newRound: (n: number) => `Runde ${n}`,
    editRound: (n: number) => `Runde ${n} bearbeiten`,
    stepBid: 'Ansage',
    stepSitOut: 'Aussetzen',
    stepTricks: 'Stiche',
    stepSummary: 'Übersicht',
    declarer: 'Wer hat die meisten Stiche angesagt?',
    bid: 'Angesagte Stiche',
    trump: 'Trumpf',
    herzHint: 'Herz: alle Punkte zählen doppelt!',
    kreuzHint: 'Kreuz: alle Spieler müssen mitspielen.',
    sitOutQuestion: 'Wer setzt diese Runde aus?',
    sitOutHint: (minScore: number) =>
      `Maximal 2 Spieler pro Runde, höchstens 2-mal hintereinander.${minScore > 0 ? ` Wer unter ${minScore} Punkten ist, muss mitspielen.` : ''}`,
    plays: 'spielt mit',
    sitsOut: 'setzt aus',
    blocked: {
      declarer: 'Ansager muss spielen',
      kreuz: 'Kreuz ist Trumpf',
      limitReached: 'Max. 2 setzen aus',
      tooFewPlayers: 'Mind. 2 müssen spielen',
      consecutive: 'Hat schon 2-mal ausgesetzt',
    } satisfies Record<Exclude<SitOutBlockReason, 'lowScore'>, string>,
    blockedLowScore: (minScore: number) => `Unter ${minScore} Punkten`,
    tricksFor: (name: string) => `Wie viele Stiche hat ${name} gemacht?`,
    declarerBid: (bid: number) => `Ansager · ${bid} angesagt`,
    remaining: (n: number) => (n === 1 ? 'Noch 1 Stich offen' : `Noch ${n} Stiche offen`),
    tooMany: (n: number) => `${n} Stich${n === 1 ? '' : 'e'} zu viel`,
    sumError: (sum: number) => `Summe der Stiche ist ${sum} – es müssen genau 5 sein.`,
    overrideHint: 'Tippe auf eine Punktänderung, um sie manuell anzupassen.',
    overridePrompt: (name: string) => `Punktänderung für ${name}`,
    resetTo: (delta: string) => `Zurück auf ${delta}`,
    next: 'Weiter',
    back: 'Zurück',
    save: 'Runde speichern',
    cancel: 'Abbrechen',
  },
  settings: {
    title: 'Einstellungen',
    sitOutMinScore: 'Aussetzen erst ab',
    sitOutMinScoreHint: (n: number) =>
      n > 0
        ? `Wer unter ${n} Punkten ist, darf nicht mehr aussetzen. Kommt er wieder auf ${n} oder mehr, darf er wieder.`
        : 'Aus: Aussetzen ist unabhängig vom Punktestand erlaubt.',
    reset: (n: number) => `Zurücksetzen auf ${n}`,
  },
  stats: {
    title: 'Statistik',
    empty: 'Noch keine beendeten Spiele.',
    games: 'Spiele',
    wins: 'Siege',
    winRate: 'Siegquote',
    avgScore: 'Ø Endstand',
    declarer: 'Ansagen erfüllt',
    zeroTricks: 'Runden ohne Stich',
    satOut: 'Ausgesetzt',
    tricks: 'Stiche gesamt',
  },
  suits: {
    kreuz: 'Kreuz',
    pik: 'Pik',
    herz: 'Herz',
    karo: 'Karo',
  } satisfies Record<Suit, string>,
};

export const suitSymbol: Record<Suit, string> = { kreuz: '♣', pik: '♠', herz: '♥', karo: '♦' };
export const SUITS: Suit[] = ['kreuz', 'pik', 'herz', 'karo'];

/** Formats a score delta with an explicit sign, e.g. "+4", "−6", "±0". */
export function formatDelta(n: number): string {
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

/** Formats a score using a typographic minus sign. */
export function formatScore(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

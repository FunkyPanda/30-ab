export type Suit = 'kreuz' | 'pik' | 'herz' | 'karo';

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  archived?: boolean;
}

export interface RoundEntry {
  playerId: string;
  sittingOut: boolean;
  tricks: number;
  /** Delta computed from the rules. */
  calculatedDelta: number;
  /** Delta actually applied; differs from calculatedDelta when manually overridden. */
  delta: number;
}

export interface Round {
  declarerId: string;
  bid: number;
  trump: Suit;
  entries: RoundEntry[];
}

export interface Correction {
  playerId: string;
  delta: number;
  note?: string;
  /** Number of rounds played when the correction was made. */
  afterRound: number;
  createdAt: number;
}

export type GameStatus = 'running' | 'finished';

export interface Game {
  id: string;
  /** Player ids in clockwise seat order. */
  playerIds: string[];
  startScore: number;
  rounds: Round[];
  corrections: Correction[];
  status: GameStatus;
  /** True if the game was ended by the user before someone reached 0. */
  endedManually?: boolean;
  createdAt: number;
  finishedAt?: number;
}

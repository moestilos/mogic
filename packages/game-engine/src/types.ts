export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

export type GameFormat = 'standard' | 'commander' | 'brawl' | 'oathbreaker' | 'casual';

export type CounterType =
  | 'poison'
  | 'energy'
  | 'experience'
  | 'storm'
  | 'commanderTax'
  | 'rad'
  | 'tickets';

export type Phase =
  | 'untap'
  | 'upkeep'
  | 'draw'
  | 'main1'
  | 'combat'
  | 'main2'
  | 'end';

export interface Player {
  id: string;
  name: string;
  color: ManaColor;
  avatar?: string;
  life: number;
  counters: Partial<Record<CounterType, number>>;
  /** commander damage received from each opponent (playerId -> dmg) */
  commanderDamageFrom: Record<string, number>;
  eliminated: boolean;
  position: number;
}

export type GameEvent =
  | { t: 'life'; pid: string; delta: number; at: number }
  | { t: 'counter'; pid: string; counter: CounterType; delta: number; at: number }
  | { t: 'cmd-dmg'; from: string; to: string; delta: number; at: number }
  | { t: 'turn'; from: string | null; to: string; at: number }
  | { t: 'phase'; phase: Phase; at: number }
  | { t: 'eliminate'; pid: string; at: number }
  | { t: 'revive'; pid: string; at: number }
  | { t: 'roll'; sides: number; result: number; at: number }
  | { t: 'rename'; pid: string; from: string; to: string; at: number };

export interface GameSnapshot {
  id: string;
  format: GameFormat;
  startingLife: number;
  players: Player[];
  turnIndex: number;
  phase: Phase;
  startedAt: number;
  endedAt?: number;
  winnerId?: string;
  events: GameEvent[];
}

export interface NewPlayerInput {
  name: string;
  color: ManaColor;
  avatar?: string;
}

export interface NewGameInput {
  format: GameFormat;
  startingLife?: number;
  players: NewPlayerInput[];
}

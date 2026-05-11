import type {
  CounterType,
  GameEvent,
  GameFormat,
  GameSnapshot,
  NewGameInput,
  Phase,
  Player,
} from './types.js';

const PHASE_ORDER: Phase[] = ['untap', 'upkeep', 'draw', 'main1', 'combat', 'main2', 'end'];

const DEFAULT_LIFE: Record<GameFormat, number> = {
  standard: 20,
  commander: 40,
  brawl: 25,
  oathbreaker: 20,
  casual: 20,
};

const COMMANDER_KILL_THRESHOLD = 21;
const POISON_KILL_THRESHOLD = 10;

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createGame(input: NewGameInput, now: number = Date.now()): GameSnapshot {
  if (input.players.length < 2 || input.players.length > 6) {
    throw new Error('Player count must be between 2 and 6');
  }
  const startingLife = input.startingLife ?? DEFAULT_LIFE[input.format];
  const players: Player[] = input.players.map((p, idx) => ({
    id: uid(),
    name: p.name,
    color: p.color,
    avatar: p.avatar,
    life: startingLife,
    counters: {},
    commanderDamageFrom: {},
    eliminated: false,
    position: idx,
  }));
  return {
    id: uid(),
    format: input.format,
    startingLife,
    players,
    turnIndex: 0,
    phase: 'main1',
    startedAt: now,
    events: [
      { t: 'turn', from: null, to: players[0].id, at: now },
    ],
  };
}

function findPlayer(g: GameSnapshot, pid: string): Player {
  const p = g.players.find((x) => x.id === pid);
  if (!p) throw new Error(`Unknown player: ${pid}`);
  return p;
}

function checkEliminations(g: GameSnapshot, now: number): void {
  for (const p of g.players) {
    if (p.eliminated) continue;
    if (p.life <= 0) {
      p.eliminated = true;
      g.events.push({ t: 'eliminate', pid: p.id, at: now });
      continue;
    }
    if ((p.counters.poison ?? 0) >= POISON_KILL_THRESHOLD) {
      p.eliminated = true;
      g.events.push({ t: 'eliminate', pid: p.id, at: now });
      continue;
    }
    for (const dmg of Object.values(p.commanderDamageFrom)) {
      if (dmg >= COMMANDER_KILL_THRESHOLD) {
        p.eliminated = true;
        g.events.push({ t: 'eliminate', pid: p.id, at: now });
        break;
      }
    }
  }
  const alive = g.players.filter((p) => !p.eliminated);
  if (alive.length === 1 && !g.endedAt) {
    g.endedAt = now;
    g.winnerId = alive[0].id;
  }
}

export function adjustLife(g: GameSnapshot, pid: string, delta: number, now: number = Date.now()): GameSnapshot {
  if (g.endedAt) return g;
  const p = findPlayer(g, pid);
  p.life += delta;
  g.events.push({ t: 'life', pid, delta, at: now });
  checkEliminations(g, now);
  return g;
}

export function adjustCounter(
  g: GameSnapshot,
  pid: string,
  counter: CounterType,
  delta: number,
  now: number = Date.now(),
): GameSnapshot {
  if (g.endedAt) return g;
  const p = findPlayer(g, pid);
  const current = p.counters[counter] ?? 0;
  const next = Math.max(0, current + delta);
  p.counters[counter] = next;
  g.events.push({ t: 'counter', pid, counter, delta: next - current, at: now });
  checkEliminations(g, now);
  return g;
}

export function dealCommanderDamage(
  g: GameSnapshot,
  fromPid: string,
  toPid: string,
  delta: number,
  now: number = Date.now(),
): GameSnapshot {
  if (g.endedAt) return g;
  if (fromPid === toPid) throw new Error('Cannot deal commander damage to self');
  const target = findPlayer(g, toPid);
  findPlayer(g, fromPid);
  const current = target.commanderDamageFrom[fromPid] ?? 0;
  const next = Math.max(0, current + delta);
  target.commanderDamageFrom[fromPid] = next;
  const applied = next - current;
  target.life -= applied;
  g.events.push({ t: 'cmd-dmg', from: fromPid, to: toPid, delta: applied, at: now });
  g.events.push({ t: 'life', pid: toPid, delta: -applied, at: now });
  checkEliminations(g, now);
  return g;
}

export function nextTurn(g: GameSnapshot, now: number = Date.now()): GameSnapshot {
  if (g.endedAt) return g;
  const alive = g.players.filter((p) => !p.eliminated);
  if (alive.length === 0) return g;
  const fromId = g.players[g.turnIndex]?.id ?? null;
  let idx = g.turnIndex;
  for (let i = 0; i < g.players.length; i++) {
    idx = (idx + 1) % g.players.length;
    if (!g.players[idx].eliminated) break;
  }
  g.turnIndex = idx;
  g.phase = 'untap';
  g.events.push({ t: 'turn', from: fromId, to: g.players[idx].id, at: now });
  g.events.push({ t: 'phase', phase: 'untap', at: now });
  return g;
}

export function advancePhase(g: GameSnapshot, now: number = Date.now()): GameSnapshot {
  if (g.endedAt) return g;
  const i = PHASE_ORDER.indexOf(g.phase);
  if (i === PHASE_ORDER.length - 1) return nextTurn(g, now);
  g.phase = PHASE_ORDER[i + 1];
  g.events.push({ t: 'phase', phase: g.phase, at: now });
  return g;
}

export function rollDie(g: GameSnapshot, sides: number, now: number = Date.now()): { result: number; game: GameSnapshot } {
  if (sides < 2) throw new Error('Die must have at least 2 sides');
  const result = 1 + Math.floor(Math.random() * sides);
  g.events.push({ t: 'roll', sides, result, at: now });
  return { result, game: g };
}

export function flipCoin(g: GameSnapshot, now: number = Date.now()): { result: 'heads' | 'tails'; game: GameSnapshot } {
  const r = Math.random() < 0.5 ? 'heads' : 'tails';
  g.events.push({ t: 'roll', sides: 2, result: r === 'heads' ? 1 : 2, at: now });
  return { result: r, game: g };
}

export function renamePlayer(g: GameSnapshot, pid: string, to: string, now: number = Date.now()): GameSnapshot {
  const p = findPlayer(g, pid);
  const from = p.name;
  p.name = to;
  g.events.push({ t: 'rename', pid, from, to, at: now });
  return g;
}

export function revivePlayer(g: GameSnapshot, pid: string, now: number = Date.now()): GameSnapshot {
  const p = findPlayer(g, pid);
  if (!p.eliminated) return g;
  p.eliminated = false;
  if (p.life <= 0) p.life = 1;
  g.events.push({ t: 'revive', pid, at: now });
  if (g.endedAt) {
    g.endedAt = undefined;
    g.winnerId = undefined;
  }
  return g;
}

/** Undo last *user* event by rebuilding state from filtered event log. */
export function undo(g: GameSnapshot): GameSnapshot {
  const undoable: GameEvent['t'][] = ['life', 'counter', 'cmd-dmg', 'turn', 'phase'];
  const idx = [...g.events].reverse().findIndex((e) => undoable.includes(e.t));
  if (idx === -1) return g;
  const cutoff = g.events.length - 1 - idx;
  const keep = g.events.slice(0, cutoff);
  return rebuildFromEvents(g, keep);
}

function rebuildFromEvents(g: GameSnapshot, events: GameEvent[]): GameSnapshot {
  const rebuilt: GameSnapshot = {
    ...g,
    players: g.players.map((p) => ({
      ...p,
      life: g.startingLife,
      counters: {},
      commanderDamageFrom: {},
      eliminated: false,
    })),
    turnIndex: 0,
    phase: 'main1',
    endedAt: undefined,
    winnerId: undefined,
    events: [],
  };
  const now = Date.now();
  for (const e of events) {
    switch (e.t) {
      case 'life':
        adjustLife(rebuilt, e.pid, e.delta, e.at);
        break;
      case 'counter':
        adjustCounter(rebuilt, e.pid, e.counter, e.delta, e.at);
        break;
      case 'cmd-dmg':
        dealCommanderDamage(rebuilt, e.from, e.to, e.delta, e.at);
        break;
      case 'turn':
        if (e.from !== null) nextTurn(rebuilt, e.at);
        break;
      case 'phase':
        advancePhase(rebuilt, e.at);
        break;
      default:
        break;
    }
    void now;
  }
  return rebuilt;
}

export const _internal = { PHASE_ORDER, DEFAULT_LIFE, COMMANDER_KILL_THRESHOLD, POISON_KILL_THRESHOLD };

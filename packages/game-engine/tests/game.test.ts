import { describe, it, expect } from 'vitest';
import {
  createGame,
  adjustLife,
  adjustCounter,
  dealCommanderDamage,
  nextTurn,
  advancePhase,
  undo,
  revivePlayer,
} from '../src/index.js';

const sample = () =>
  createGame({
    format: 'commander',
    players: [
      { name: 'Alice', color: 'U' },
      { name: 'Bob', color: 'R' },
      { name: 'Cara', color: 'G' },
      { name: 'Dan', color: 'B' },
    ],
  });

describe('createGame', () => {
  it('starts at 40 life for commander', () => {
    const g = sample();
    expect(g.players.every((p) => p.life === 40)).toBe(true);
    expect(g.startingLife).toBe(40);
  });

  it('rejects <2 or >6 players', () => {
    expect(() => createGame({ format: 'commander', players: [{ name: 'A', color: 'W' }] })).toThrow();
  });
});

describe('adjustLife', () => {
  it('changes life and logs event', () => {
    const g = sample();
    adjustLife(g, g.players[0].id, -5);
    expect(g.players[0].life).toBe(35);
    expect(g.events.at(-1)?.t).toBe('life');
  });

  it('eliminates at 0', () => {
    const g = sample();
    adjustLife(g, g.players[0].id, -40);
    expect(g.players[0].eliminated).toBe(true);
  });

  it('declares winner when last alive', () => {
    const g = sample();
    adjustLife(g, g.players[0].id, -40);
    adjustLife(g, g.players[1].id, -40);
    adjustLife(g, g.players[2].id, -40);
    expect(g.winnerId).toBe(g.players[3].id);
    expect(g.endedAt).toBeDefined();
  });
});

describe('counters', () => {
  it('poison at 10 eliminates', () => {
    const g = sample();
    adjustCounter(g, g.players[0].id, 'poison', 10);
    expect(g.players[0].eliminated).toBe(true);
  });

  it('counters never go below 0', () => {
    const g = sample();
    adjustCounter(g, g.players[0].id, 'energy', -5);
    expect(g.players[0].counters.energy).toBe(0);
  });
});

describe('commander damage', () => {
  it('21 from one source eliminates', () => {
    const g = sample();
    dealCommanderDamage(g, g.players[0].id, g.players[1].id, 21);
    expect(g.players[1].eliminated).toBe(true);
    expect(g.players[1].life).toBe(40 - 21);
  });

  it('tracks per-source commander damage independently', () => {
    const g = sample();
    dealCommanderDamage(g, g.players[0].id, g.players[3].id, 15);
    dealCommanderDamage(g, g.players[1].id, g.players[3].id, 15);
    expect(g.players[3].commanderDamageFrom[g.players[0].id]).toBe(15);
    expect(g.players[3].commanderDamageFrom[g.players[1].id]).toBe(15);
    expect(g.players[3].eliminated).toBe(false);
    expect(g.players[3].life).toBe(10);
  });
});

describe('turn flow', () => {
  it('skips eliminated players', () => {
    const g = sample();
    adjustLife(g, g.players[1].id, -40);
    nextTurn(g);
    expect(g.turnIndex).toBe(2);
  });

  it('advancePhase cycles to next turn after end phase', () => {
    const g = sample();
    // initial phase = main1 (idx 3). 4 advances → combat, main2, end, then nextTurn → untap
    for (let i = 0; i < 4; i++) advancePhase(g);
    expect(g.turnIndex).toBe(1);
    expect(g.phase).toBe('untap');
  });
});

describe('undo', () => {
  it('reverts last life adjustment', () => {
    const g = sample();
    adjustLife(g, g.players[0].id, -10);
    const restored = undo(g);
    expect(restored.players[0].life).toBe(40);
  });
});

describe('revive', () => {
  it('reopens game if revived after end', () => {
    const g = sample();
    adjustLife(g, g.players[0].id, -40);
    adjustLife(g, g.players[1].id, -40);
    adjustLife(g, g.players[2].id, -40);
    expect(g.winnerId).toBeDefined();
    revivePlayer(g, g.players[0].id);
    expect(g.winnerId).toBeUndefined();
    expect(g.players[0].eliminated).toBe(false);
  });
});

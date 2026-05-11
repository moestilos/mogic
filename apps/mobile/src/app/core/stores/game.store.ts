import { Injectable, computed, signal } from '@angular/core';
import {
  adjustCounter,
  adjustLife,
  advancePhase,
  createGame,
  dealCommanderDamage,
  nextTurn,
  renamePlayer,
  revivePlayer,
  undo,
  type CounterType,
  type GameSnapshot,
  type NewGameInput,
} from '@crown/game-engine';
import { StorageService } from '../services/storage.service';

@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly _game = signal<GameSnapshot | null>(null);

  readonly game = this._game.asReadonly();
  readonly players = computed(() => this._game()?.players ?? []);
  readonly activePlayer = computed(() => {
    const g = this._game();
    if (!g) return null;
    return g.players[g.turnIndex] ?? null;
  });
  readonly aliveCount = computed(
    () => this._game()?.players.filter((p) => !p.eliminated).length ?? 0,
  );
  readonly winner = computed(() => {
    const g = this._game();
    if (!g?.winnerId) return null;
    return g.players.find((p) => p.id === g.winnerId) ?? null;
  });
  readonly isOver = computed(() => !!this._game()?.endedAt);

  constructor(private readonly storage: StorageService) {}

  async restore(): Promise<void> {
    const g = await this.storage.loadActive();
    if (g) this._game.set(g);
  }

  start(input: NewGameInput): void {
    const g = createGame(input);
    this._game.set(g);
    void this.storage.saveActive(g);
  }

  private mutate(fn: (g: GameSnapshot) => GameSnapshot | void): void {
    const current = this._game();
    if (!current) return;
    const cloned = structuredClone(current);
    const next = fn(cloned) ?? cloned;
    this._game.set({ ...next });
    void this.storage.saveActive(next);
  }

  life(pid: string, delta: number): void {
    this.mutate((g) => adjustLife(g, pid, delta));
  }

  counter(pid: string, c: CounterType, delta: number): void {
    this.mutate((g) => adjustCounter(g, pid, c, delta));
  }

  cmdDamage(fromPid: string, toPid: string, delta: number): void {
    this.mutate((g) => dealCommanderDamage(g, fromPid, toPid, delta));
  }

  nextTurn(): void {
    this.mutate((g) => nextTurn(g));
  }

  advancePhase(): void {
    this.mutate((g) => advancePhase(g));
  }

  rename(pid: string, to: string): void {
    this.mutate((g) => renamePlayer(g, pid, to));
  }

  revive(pid: string): void {
    this.mutate((g) => revivePlayer(g, pid));
  }

  undo(): void {
    this.mutate((g) => undo(g));
  }

  async end(): Promise<void> {
    const g = this._game();
    if (g) await this.storage.pushHistory(g);
    await this.storage.clearActive();
    this._game.set(null);
  }
}

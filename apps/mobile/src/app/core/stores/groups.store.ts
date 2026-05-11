import { Injectable, computed, inject, signal } from '@angular/core';
import {
  addProfile,
  computeStandings,
  createGroup,
  removeProfile,
  renameProfile,
  resultFromGame,
  type GameSnapshot,
  type Group,
  type GroupGameResult,
  type ManaColor,
  type Standing,
} from '@crown/game-engine';
import { StorageService } from '../services/storage.service';

@Injectable({ providedIn: 'root' })
export class GroupsStore {
  private readonly storage = inject(StorageService);

  private readonly _groups = signal<Group[]>([]);
  private readonly _results = signal<GroupGameResult[]>([]);
  /** Active group selected for the next/current game session. */
  private readonly _activeGroupId = signal<string | null>(null);
  /** Mapping of in-game playerId -> groupProfileId for the active session. */
  private readonly _playerToProfile = signal<Record<string, string>>({});

  readonly groups = this._groups.asReadonly();
  readonly results = this._results.asReadonly();
  readonly activeGroupId = this._activeGroupId.asReadonly();

  readonly activeGroup = computed(() => {
    const id = this._activeGroupId();
    return id ? this._groups().find((g) => g.id === id) ?? null : null;
  });

  async load(): Promise<void> {
    const [groups, results] = await Promise.all([
      this.storage.getGroups(),
      this.storage.getGroupResults(),
    ]);
    this._groups.set(groups);
    this._results.set(results);
  }

  async createGroup(name: string, emoji?: string): Promise<Group> {
    const g = createGroup(name, emoji);
    const next = [g, ...this._groups()];
    this._groups.set(next);
    await this.storage.saveGroups(next);
    return g;
  }

  async deleteGroup(groupId: string): Promise<void> {
    const next = this._groups().filter((g) => g.id !== groupId);
    this._groups.set(next);
    await this.storage.saveGroups(next);
    const nextResults = this._results().filter((r) => r.groupId !== groupId);
    this._results.set(nextResults);
    await this.storage.saveGroupResults(nextResults);
  }

  async addProfile(groupId: string, name: string, color: ManaColor): Promise<void> {
    const updated = this._groups().map((g) =>
      g.id === groupId ? addProfile(g, { name, color }) : g,
    );
    this._groups.set(updated);
    await this.storage.saveGroups(updated);
  }

  async removeProfile(groupId: string, profileId: string): Promise<void> {
    const updated = this._groups().map((g) =>
      g.id === groupId ? removeProfile(g, profileId) : g,
    );
    this._groups.set(updated);
    await this.storage.saveGroups(updated);
  }

  async renameProfile(groupId: string, profileId: string, name: string): Promise<void> {
    const updated = this._groups().map((g) =>
      g.id === groupId ? renameProfile(g, profileId, name) : g,
    );
    this._groups.set(updated);
    await this.storage.saveGroups(updated);
  }

  setActiveSession(groupId: string, mapping: Record<string, string>): void {
    this._activeGroupId.set(groupId);
    this._playerToProfile.set(mapping);
  }

  clearActiveSession(): void {
    this._activeGroupId.set(null);
    this._playerToProfile.set({});
  }

  /** Called when a game ends — registers result against active group if any. */
  async registerGameResult(game: GameSnapshot): Promise<GroupGameResult | null> {
    const groupId = this._activeGroupId();
    if (!groupId) return null;
    const group = this._groups().find((g) => g.id === groupId);
    if (!group) return null;
    const mapping = this._playerToProfile();
    const result = resultFromGame(group, game, mapping);
    if (!result) return null;
    const next = [result, ...this._results()];
    this._results.set(next);
    await this.storage.saveGroupResults(next);
    return result;
  }

  resultsForGroup(groupId: string): GroupGameResult[] {
    return this._results().filter((r) => r.groupId === groupId);
  }

  standingsForGroup(groupId: string): Standing[] {
    const group = this._groups().find((g) => g.id === groupId);
    if (!group) return [];
    return computeStandings(group, this.resultsForGroup(groupId));
  }
}

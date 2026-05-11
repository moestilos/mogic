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
import { ApiService } from '../services/api.service';

@Injectable({ providedIn: 'root' })
export class GroupsStore {
  private readonly storage = inject(StorageService);
  private readonly api = inject(ApiService);

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
    if (this.api.enabled) {
      try {
        const remote = await this.api.listGroups();
        const groups: Group[] = remote.map((r) => ({
          id: r.id, name: r.name, emoji: r.icon,
          profiles: [], createdAt: new Date(r.createdAt).getTime(),
        }));
        // Load profiles per group in parallel
        const detailed = await Promise.all(
          groups.map(async (g) => {
            try {
              const d = await this.api.getGroup(g.id);
              return {
                group: {
                  ...g,
                  profiles: d.profiles.map((p) => ({
                    id: p.id, name: p.displayName, color: p.color,
                    avatar: p.avatar ?? 'User', createdAt: Date.now(),
                  })),
                },
                results: d.results.map((r) => ({
                  id: r.id, groupId: r.groupId, format: r.format,
                  startedAt: new Date(r.startedAt).getTime(),
                  endedAt: new Date(r.endedAt).getTime(),
                  placements: r.placements,
                  gameId: r.id,
                })),
              };
            } catch { return { group: g, results: [] as GroupGameResult[] }; }
          })
        );
        this._groups.set(detailed.map((d) => d.group));
        this._results.set(detailed.flatMap((d) => d.results));
        return;
      } catch (e) {
        console.warn('[mogic] listGroups api failed, fallback local', e);
      }
    }
    const [groups, results] = await Promise.all([
      this.storage.getGroups(),
      this.storage.getGroupResults(),
    ]);
    this._groups.set(groups);
    this._results.set(results);
  }

  async createGroup(name: string, emoji?: string): Promise<Group> {
    if (this.api.enabled) {
      try {
        const r = await this.api.createGroup({ name, icon: emoji ?? 'Crown' });
        const g: Group = { id: r.id, name: r.name, emoji: r.icon, profiles: [], createdAt: new Date(r.createdAt).getTime() };
        this._groups.set([g, ...this._groups()]);
        return g;
      } catch (e) { console.warn('[mogic] createGroup api failed', e); }
    }
    const g = createGroup(name, emoji);
    const next = [g, ...this._groups()];
    this._groups.set(next);
    await this.storage.saveGroups(next);
    return g;
  }

  async deleteGroup(groupId: string): Promise<void> {
    if (this.api.enabled) {
      try { await this.api.deleteGroup(groupId); } catch (e) { console.warn(e); }
    }
    const next = this._groups().filter((g) => g.id !== groupId);
    this._groups.set(next);
    await this.storage.saveGroups(next);
    const nextResults = this._results().filter((r) => r.groupId !== groupId);
    this._results.set(nextResults);
    await this.storage.saveGroupResults(nextResults);
  }

  async addProfile(groupId: string, name: string, color: ManaColor): Promise<void> {
    if (this.api.enabled) {
      try {
        const r = await this.api.addGroupProfile(groupId, { displayName: name, color, avatar: 'User' });
        const updated = this._groups().map((g) =>
          g.id === groupId ? { ...g, profiles: [...g.profiles, { id: r.id, name: r.displayName, color: r.color, avatar: r.avatar ?? 'User', createdAt: Date.now() }] } : g
        );
        this._groups.set(updated);
        return;
      } catch (e) { console.warn('[mogic] addGroupProfile api failed', e); }
    }
    const updated = this._groups().map((g) =>
      g.id === groupId ? addProfile(g, { name, color }) : g,
    );
    this._groups.set(updated);
    await this.storage.saveGroups(updated);
  }

  async removeProfile(groupId: string, profileId: string): Promise<void> {
    if (this.api.enabled) {
      try { await this.api.deleteGroupProfile(groupId, profileId); } catch (e) { console.warn(e); }
    }
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

    if (this.api.enabled) {
      try {
        await this.api.addGroupResult(groupId, {
          format: result.format,
          startedAt: new Date(result.startedAt).toISOString(),
          endedAt: new Date(result.endedAt).toISOString(),
          placements: result.placements,
        });
      } catch (e) { console.warn('[mogic] addGroupResult api failed', e); }
    }

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

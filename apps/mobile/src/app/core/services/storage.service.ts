import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import type { GameSnapshot, Group, GroupGameResult } from '@crown/game-engine';

const ACTIVE_KEY = 'crown.activeGame';
const HISTORY_KEY = 'crown.history';
const GROUPS_KEY = 'crown.groups';
const GROUP_RESULTS_KEY = 'crown.groupResults';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async saveActive(game: GameSnapshot): Promise<void> {
    await Preferences.set({ key: ACTIVE_KEY, value: JSON.stringify(game) });
  }

  async loadActive(): Promise<GameSnapshot | null> {
    const { value } = await Preferences.get({ key: ACTIVE_KEY });
    return value ? (JSON.parse(value) as GameSnapshot) : null;
  }

  async clearActive(): Promise<void> {
    await Preferences.remove({ key: ACTIVE_KEY });
  }

  async pushHistory(game: GameSnapshot): Promise<void> {
    const { value } = await Preferences.get({ key: HISTORY_KEY });
    const list: GameSnapshot[] = value ? JSON.parse(value) : [];
    list.unshift(game);
    await Preferences.set({ key: HISTORY_KEY, value: JSON.stringify(list.slice(0, 100)) });
  }

  async getHistory(): Promise<GameSnapshot[]> {
    const { value } = await Preferences.get({ key: HISTORY_KEY });
    return value ? (JSON.parse(value) as GameSnapshot[]) : [];
  }

  // ── Groups ────────────────────────────────────────────────
  async getGroups(): Promise<Group[]> {
    const { value } = await Preferences.get({ key: GROUPS_KEY });
    return value ? (JSON.parse(value) as Group[]) : [];
  }

  async saveGroups(groups: Group[]): Promise<void> {
    await Preferences.set({ key: GROUPS_KEY, value: JSON.stringify(groups) });
  }

  async getGroupResults(): Promise<GroupGameResult[]> {
    const { value } = await Preferences.get({ key: GROUP_RESULTS_KEY });
    return value ? (JSON.parse(value) as GroupGameResult[]) : [];
  }

  async saveGroupResults(results: GroupGameResult[]): Promise<void> {
    await Preferences.set({ key: GROUP_RESULTS_KEY, value: JSON.stringify(results) });
  }

  async appendGroupResult(result: GroupGameResult): Promise<void> {
    const list = await this.getGroupResults();
    list.unshift(result);
    await this.saveGroupResults(list);
  }
}

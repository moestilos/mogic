import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import type { ManaColor } from '@crown/game-engine';

export interface MyProfile {
  id: string;
  name: string;
  color: ManaColor;
  avatar: string;
  createdAt: number;
}

export interface Friend {
  id: string;
  /** Linked auth account id (set when added via friend-request). */
  accountId?: string;
  name: string;
  color: ManaColor;
  avatar: string;
  /** Local-only counter that increments when friend wins a tracked game. */
  wins: number;
  /** Total games played together. */
  games: number;
  addedAt: number;
}

const PROFILE_KEY = 'crown.profile';
const FRIENDS_KEY_BASE = 'crown.friends';
const friendsKeyFor = (accountId: string | null): string =>
  accountId ? `${FRIENDS_KEY_BASE}.${accountId}` : FRIENDS_KEY_BASE;

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly _me = signal<MyProfile | null>(null);
  private readonly _friends = signal<Friend[]>([]);
  private readonly _loaded = signal(false);
  /** Auth account id used for scoped friend storage. Set externally via setScope. */
  private _scope: string | null = null;

  readonly me = this._me.asReadonly();
  readonly friends = this._friends.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly isSignedIn = computed(() => this._me() !== null);

  async load(): Promise<void> {
    if (this._loaded()) return;
    const profileRes = await Preferences.get({ key: PROFILE_KEY });
    if (profileRes.value) {
      try { this._me.set(JSON.parse(profileRes.value) as MyProfile); } catch {}
    }
    await this.loadFriends();
    this._loaded.set(true);
  }

  async setScope(accountId: string | null): Promise<void> {
    this._scope = accountId;
    await this.loadFriends();
  }

  private async loadFriends(): Promise<void> {
    const { value } = await Preferences.get({ key: friendsKeyFor(this._scope) });
    if (value) {
      try { this._friends.set(JSON.parse(value) as Friend[]); return; } catch {}
    }
    this._friends.set([]);
  }

  private async persistFriends(): Promise<void> {
    await Preferences.set({ key: friendsKeyFor(this._scope), value: JSON.stringify(this._friends()) });
  }

  async signIn(name: string, color: ManaColor, avatar: string): Promise<void> {
    const profile: MyProfile = {
      id: uid(),
      name: name.trim(),
      color,
      avatar,
      createdAt: Date.now(),
    };
    this._me.set(profile);
    await Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(profile) });
  }

  async updateProfile(partial: Partial<Omit<MyProfile, 'id' | 'createdAt'>>): Promise<void> {
    const current = this._me();
    if (!current) return;
    const next: MyProfile = { ...current, ...partial };
    this._me.set(next);
    await Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(next) });
  }

  async signOut(): Promise<void> {
    this._me.set(null);
    this._friends.set([]);
    await Preferences.remove({ key: PROFILE_KEY });
    this._scope = null;
  }

  hasFriendForAccount(accountId: string): boolean {
    return this._friends().some((f) => f.accountId === accountId);
  }

  async addFriend(name: string, color: ManaColor, avatar = 'User', accountId?: string): Promise<Friend> {
    if (accountId && this.hasFriendForAccount(accountId)) {
      return this._friends().find((f) => f.accountId === accountId)!;
    }
    const friend: Friend = {
      id: uid(),
      accountId,
      name: name.trim(),
      color,
      avatar,
      wins: 0,
      games: 0,
      addedAt: Date.now(),
    };
    const next = [friend, ...this._friends()];
    this._friends.set(next);
    await this.persistFriends();
    return friend;
  }

  async removeFriend(id: string): Promise<void> {
    const next = this._friends().filter((f) => f.id !== id);
    this._friends.set(next);
    await this.persistFriends();
  }

  async renameFriend(id: string, name: string): Promise<void> {
    const next = this._friends().map((f) => (f.id === id ? { ...f, name: name.trim() } : f));
    this._friends.set(next);
    await this.persistFriends();
  }

  async recordWin(friendId: string): Promise<void> {
    const next = this._friends().map((f) => (f.id === friendId ? { ...f, wins: f.wins + 1, games: f.games + 1 } : f));
    this._friends.set(next);
    await this.persistFriends();
  }

  async recordParticipation(friendIds: string[]): Promise<void> {
    const next = this._friends().map((f) => (friendIds.includes(f.id) ? { ...f, games: f.games + 1 } : f));
    this._friends.set(next);
    await this.persistFriends();
  }
}

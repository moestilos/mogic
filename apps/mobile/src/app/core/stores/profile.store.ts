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
const FRIENDS_KEY = 'crown.friends';

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly _me = signal<MyProfile | null>(null);
  private readonly _friends = signal<Friend[]>([]);
  private readonly _loaded = signal(false);

  readonly me = this._me.asReadonly();
  readonly friends = this._friends.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly isSignedIn = computed(() => this._me() !== null);

  async load(): Promise<void> {
    if (this._loaded()) return;
    const [profileRes, friendsRes] = await Promise.all([
      Preferences.get({ key: PROFILE_KEY }),
      Preferences.get({ key: FRIENDS_KEY }),
    ]);
    if (profileRes.value) {
      try { this._me.set(JSON.parse(profileRes.value) as MyProfile); } catch {}
    }
    if (friendsRes.value) {
      try { this._friends.set(JSON.parse(friendsRes.value) as Friend[]); } catch {}
    }
    this._loaded.set(true);
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
    await Preferences.remove({ key: FRIENDS_KEY });
  }

  async addFriend(name: string, color: ManaColor, avatar = '👤'): Promise<Friend> {
    const friend: Friend = {
      id: uid(),
      name: name.trim(),
      color,
      avatar,
      wins: 0,
      games: 0,
      addedAt: Date.now(),
    };
    const next = [friend, ...this._friends()];
    this._friends.set(next);
    await Preferences.set({ key: FRIENDS_KEY, value: JSON.stringify(next) });
    return friend;
  }

  async removeFriend(id: string): Promise<void> {
    const next = this._friends().filter((f) => f.id !== id);
    this._friends.set(next);
    await Preferences.set({ key: FRIENDS_KEY, value: JSON.stringify(next) });
  }

  async renameFriend(id: string, name: string): Promise<void> {
    const next = this._friends().map((f) => (f.id === id ? { ...f, name: name.trim() } : f));
    this._friends.set(next);
    await Preferences.set({ key: FRIENDS_KEY, value: JSON.stringify(next) });
  }

  async recordWin(friendId: string): Promise<void> {
    const next = this._friends().map((f) => (f.id === friendId ? { ...f, wins: f.wins + 1, games: f.games + 1 } : f));
    this._friends.set(next);
    await Preferences.set({ key: FRIENDS_KEY, value: JSON.stringify(next) });
  }

  async recordParticipation(friendIds: string[]): Promise<void> {
    const next = this._friends().map((f) => (friendIds.includes(f.id) ? { ...f, games: f.games + 1 } : f));
    this._friends.set(next);
    await Preferences.set({ key: FRIENDS_KEY, value: JSON.stringify(next) });
  }
}

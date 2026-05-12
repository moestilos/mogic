import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { API_ENABLED, MOGIC_API_URL } from '../../../environments/api';

const TOKEN_KEY = 'mogic.token';

export interface ApiProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  color: 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
  avatar: string;
  theme?: string;
}

export interface ApiFriend {
  id: string;
  ownerId: string;
  friendUserId: string | null;
  displayName: string;
  color: 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
  avatar: string;
  wins: number;
  games: number;
  addedAt: string;
}

export interface ApiGroup {
  id: string;
  ownerId: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface ApiFriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  respondedAt: string | null;
}

export interface ApiUserSearchResult {
  id: string;
  username: string;
  displayName: string;
  color: 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
  avatar: string;
}

export interface ApiGroupProfile {
  id: string;
  groupId: string;
  friendId: string | null;
  displayName: string;
  color: 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
  avatar: string;
  position: number;
}

export interface ApiGroupResult {
  id: string;
  groupId: string;
  format: string;
  startedAt: string;
  endedAt: string;
  placements: { profileId: string; placement: number }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly enabled = API_ENABLED;
  readonly tokenSig = signal<string | null>(null);

  async init(): Promise<void> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (value) this.tokenSig.set(value);
  }

  async setToken(token: string | null): Promise<void> {
    this.tokenSig.set(token);
    if (token) await Preferences.set({ key: TOKEN_KEY, value: token });
    else await Preferences.remove({ key: TOKEN_KEY });
  }

  private async req<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
    if (!API_ENABLED) throw new Error('API not configured');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.auth !== false) {
      const token = this.tokenSig();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${MOGIC_API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }

  // ── Auth ─────────────────────────────────────────────────
  async register(input: { email: string; password: string; displayName: string; color: string; avatar: string }): Promise<{ token: string; profile: ApiProfile }> {
    const data = await this.req<{ token: string; profile: ApiProfile }>('/api/auth/register', { method: 'POST', body: input, auth: false });
    await this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<{ token: string; profile: ApiProfile }> {
    const data = await this.req<{ token: string; profile: ApiProfile }>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    await this.setToken(data.token);
    return data;
  }

  async me(): Promise<ApiProfile | null> {
    if (!this.tokenSig()) return null;
    try {
      const data = await this.req<{ profile: ApiProfile }>('/api/auth/me');
      return data.profile;
    } catch {
      await this.setToken(null);
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.setToken(null);
  }

  async patchMe(patch: Partial<Pick<ApiProfile, 'displayName' | 'color' | 'avatar' | 'theme'>>): Promise<ApiProfile> {
    const data = await this.req<{ profile: ApiProfile }>('/api/auth/me', { method: 'PATCH', body: patch });
    return data.profile;
  }

  // ── Friends ──────────────────────────────────────────────
  async listFriends(): Promise<ApiFriend[]> {
    const data = await this.req<{ friends: ApiFriend[] }>('/api/friends/');
    return data.friends;
  }

  async addFriend(input: { displayName: string; color: string; avatar: string }): Promise<ApiFriend> {
    const data = await this.req<{ friend: ApiFriend }>('/api/friends/', { method: 'POST', body: input });
    return data.friend;
  }

  async deleteFriend(id: string): Promise<void> {
    await this.req(`/api/friends/${id}`, { method: 'DELETE' });
  }

  async recordGame(input: { winnerFriendId?: string; participantFriendIds: string[] }): Promise<void> {
    await this.req('/api/friends/record-game', { method: 'POST', body: input });
  }

  async patchFriend(id: string, patch: Partial<Pick<ApiFriend, 'displayName' | 'color' | 'avatar'>>): Promise<ApiFriend> {
    const data = await this.req<{ friend: ApiFriend }>(`/api/friends/${id}`, { method: 'PATCH', body: patch });
    return data.friend;
  }

  // ── Friend Requests ──────────────────────────────────────
  async searchUsers(q: string): Promise<ApiUserSearchResult[]> {
    const data = await this.req<{ users: ApiUserSearchResult[] }>(`/api/friend-requests/search?q=${encodeURIComponent(q)}`);
    return data.users;
  }

  async listFriendRequests(): Promise<ApiFriendRequest[]> {
    const data = await this.req<{ requests: ApiFriendRequest[] }>('/api/friend-requests/');
    return data.requests;
  }

  async sendFriendRequest(toUserId: string): Promise<ApiFriendRequest> {
    const data = await this.req<{ request: ApiFriendRequest }>('/api/friend-requests/', { method: 'POST', body: { toUserId } });
    return data.request;
  }

  async acceptFriendRequest(id: string): Promise<void> {
    await this.req(`/api/friend-requests/${id}/accept`, { method: 'POST' });
  }

  async declineFriendRequest(id: string): Promise<void> {
    await this.req(`/api/friend-requests/${id}/decline`, { method: 'POST' });
  }

  async cancelFriendRequest(id: string): Promise<void> {
    await this.req(`/api/friend-requests/${id}/cancel`, { method: 'POST' });
  }

  // ── Groups ───────────────────────────────────────────────
  async listGroups(): Promise<ApiGroup[]> {
    const data = await this.req<{ groups: ApiGroup[] }>('/api/groups/');
    return data.groups;
  }

  async createGroup(input: { name: string; icon: string }): Promise<ApiGroup> {
    const data = await this.req<{ group: ApiGroup }>('/api/groups/', { method: 'POST', body: input });
    return data.group;
  }

  async getGroup(id: string): Promise<{ group: ApiGroup; profiles: ApiGroupProfile[]; results: ApiGroupResult[] }> {
    return this.req(`/api/groups/${id}`);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.req(`/api/groups/${id}`, { method: 'DELETE' });
  }

  async addGroupProfile(groupId: string, input: { friendId?: string; displayName: string; color: string; avatar: string }): Promise<ApiGroupProfile> {
    const data = await this.req<{ profile: ApiGroupProfile }>(`/api/groups/${groupId}/profiles`, { method: 'POST', body: input });
    return data.profile;
  }

  async deleteGroupProfile(groupId: string, profileId: string): Promise<void> {
    await this.req(`/api/groups/${groupId}/profiles/${profileId}`, { method: 'DELETE' });
  }

  async addGroupResult(groupId: string, input: { format: string; startedAt: string; endedAt: string; placements: { profileId: string; placement: number }[] }): Promise<ApiGroupResult> {
    const data = await this.req<{ result: ApiGroupResult }>(`/api/groups/${groupId}/results`, { method: 'POST', body: input });
    return data.result;
  }

  // ── Admin ────────────────────────────────────────────────
  async adminListUsers(): Promise<{ id: string; email: string; username: string; displayName: string; color: ApiProfile['color']; avatar: string; createdAt: string }[]> {
    const data = await this.req<{ users: { id: string; email: string; username: string; displayName: string; color: ApiProfile['color']; avatar: string; createdAt: string }[] }>('/api/admin/users');
    return data.users;
  }
}

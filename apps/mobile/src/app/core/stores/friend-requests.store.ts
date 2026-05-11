import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CryptoService } from '../services/crypto.service';
import { AuthStore } from './auth.store';
import { ProfileStore } from './profile.store';
import { NotificationsStore } from './notifications.store';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface FriendRequest {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  status: RequestStatus;
  createdAt: number;
  respondedAt?: number;
}

const KEY = 'mogic.friendRequests';

@Injectable({ providedIn: 'root' })
export class FriendRequestsStore {
  private readonly crypto = inject(CryptoService);
  private readonly auth = inject(AuthStore);
  private readonly profile = inject(ProfileStore);
  private readonly notifs = inject(NotificationsStore);

  private readonly _requests = signal<FriendRequest[]>([]);
  private readonly _loaded = signal(false);

  readonly all = this._requests.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /** Requests sent BY me waiting for response from others. */
  readonly outgoingPending = computed(() => {
    const me = this.auth.me();
    if (!me) return [];
    return this._requests().filter((r) => r.fromAccountId === me.id && r.status === 'pending');
  });

  /** Requests received by me waiting for my response. */
  readonly incomingPending = computed(() => {
    const me = this.auth.me();
    if (!me) return [];
    return this._requests().filter((r) => r.toAccountId === me.id && r.status === 'pending');
  });

  /** Accepted requests involving me (both directions). */
  readonly accepted = computed(() => {
    const me = this.auth.me();
    if (!me) return [];
    return this._requests().filter((r) =>
      r.status === 'accepted' && (r.fromAccountId === me.id || r.toAccountId === me.id)
    );
  });

  async load(): Promise<void> {
    if (this._loaded()) return;
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      try { this._requests.set(JSON.parse(value)); } catch {}
    }
    this._loaded.set(true);
    await this.syncAcceptedToLocalFriends();
  }

  /**
   * For all my accepted requests, ensure the other party is in my local friends list.
   * Catches up the sender side: when User A sent a request and User B accepted it
   * (while A was logged out), the accept only added A to B's friends. When A logs back
   * in this method adds B to A's friends.
   */
  async syncAcceptedToLocalFriends(): Promise<void> {
    const me = this.auth.me();
    if (!me) return;
    const accepted = this._requests().filter((r) =>
      r.status === 'accepted' && (r.fromAccountId === me.id || r.toAccountId === me.id)
    );
    for (const r of accepted) {
      const otherId = r.fromAccountId === me.id ? r.toAccountId : r.fromAccountId;
      if (this.profile.hasFriendForAccount(otherId)) continue;
      const other = this.auth.accountById(otherId);
      if (!other) continue;
      await this.profile.addFriend(other.displayName, other.color, other.avatar, other.id);
    }
  }

  private async persist(): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(this._requests()) });
  }

  hasRelation(targetAccountId: string): 'none' | 'sent' | 'received' | 'friends' {
    const me = this.auth.me();
    if (!me) return 'none';
    const r = this._requests().find((req) =>
      (req.fromAccountId === me.id && req.toAccountId === targetAccountId) ||
      (req.fromAccountId === targetAccountId && req.toAccountId === me.id)
    );
    if (!r) return 'none';
    if (r.status === 'accepted') return 'friends';
    if (r.status === 'pending') return r.fromAccountId === me.id ? 'sent' : 'received';
    return 'none';
  }

  async sendRequest(targetAccountId: string): Promise<{ error: string | null }> {
    const me = this.auth.me();
    if (!me) return { error: 'No has iniciado sesión' };
    if (me.id === targetAccountId) return { error: 'No puedes añadirte a ti mismo' };

    const relation = this.hasRelation(targetAccountId);
    if (relation === 'friends') return { error: 'Ya sois amigos' };
    if (relation === 'sent') return { error: 'Solicitud ya enviada' };
    if (relation === 'received') return { error: 'Tienes una solicitud suya pendiente. Acepta para añadirlo' };

    const target = this.auth.accountById(targetAccountId);
    if (!target) return { error: 'Usuario no encontrado' };

    const req: FriendRequest = {
      id: this.crypto.randomId(),
      fromAccountId: me.id,
      toAccountId: targetAccountId,
      status: 'pending',
      createdAt: Date.now(),
    };
    this._requests.set([...this._requests(), req]);
    await this.persist();

    // Notification para target (otra cuenta)
    await this.notifs.push({
      kind: 'invite',
      title: 'Nueva solicitud de amistad',
      body: `${me.displayName} (@${me.username}) quiere ser tu amigo`,
      icon: 'UserPlus',
      action: { route: '/profile' },
      accountId: targetAccountId,
    });

    return { error: null };
  }

  async cancelRequest(requestId: string): Promise<void> {
    const me = this.auth.me();
    if (!me) return;
    this._requests.set(this._requests().map((r) =>
      r.id === requestId && r.fromAccountId === me.id && r.status === 'pending'
        ? { ...r, status: 'cancelled', respondedAt: Date.now() }
        : r
    ));
    await this.persist();
  }

  async acceptRequest(requestId: string): Promise<{ error: string | null }> {
    const me = this.auth.me();
    if (!me) return { error: 'No has iniciado sesión' };
    const req = this._requests().find((r) => r.id === requestId);
    if (!req) return { error: 'Solicitud no encontrada' };
    if (req.toAccountId !== me.id) return { error: 'No autorizado' };
    if (req.status !== 'pending') return { error: 'Solicitud ya procesada' };

    const from = this.auth.accountById(req.fromAccountId);
    if (!from) return { error: 'Usuario no encontrado' };

    // Marcar aceptada
    this._requests.set(this._requests().map((r) =>
      r.id === requestId ? { ...r, status: 'accepted' as const, respondedAt: Date.now() } : r
    ));
    await this.persist();

    // Añadir a la lista de amigos LOCAL del usuario actual (con link a su accountId)
    await this.profile.addFriend(from.displayName, from.color, from.avatar, from.id);

    // Notificación al solicitante
    await this.notifs.push({
      kind: 'invite',
      title: 'Solicitud aceptada',
      body: `${me.displayName} aceptó tu solicitud de amistad`,
      icon: 'Check',
      action: { route: '/profile' },
      accountId: req.fromAccountId,
    });

    return { error: null };
  }

  async declineRequest(requestId: string): Promise<void> {
    const me = this.auth.me();
    if (!me) return;
    this._requests.set(this._requests().map((r) =>
      r.id === requestId && r.toAccountId === me.id && r.status === 'pending'
        ? { ...r, status: 'declined', respondedAt: Date.now() }
        : r
    ));
    await this.persist();
  }
}

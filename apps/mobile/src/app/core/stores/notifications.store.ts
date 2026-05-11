import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CryptoService } from '../services/crypto.service';

export type NotifKind = 'invite' | 'friend-added' | 'game-won' | 'game-lost' | 'info';

export interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  body?: string;
  icon: string;
  createdAt: number;
  read: boolean;
  /** Optional action target (eg. route + id for invite accept). */
  action?: { route: string; params?: Record<string, string> };
  /** Account id scope — null = global */
  accountId: string | null;
}

const KEY = 'mogic.notifications';
const MAX = 50;

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly crypto = inject(CryptoService);

  private readonly _items = signal<Notif[]>([]);
  private readonly _loaded = signal(false);
  private _scope: string | null = null;

  readonly items = computed(() =>
    this._items().filter((n) => n.accountId === null || n.accountId === this._scope)
  );
  readonly unread = computed(() => this.items().filter((n) => !n.read).length);

  async load(scopeAccountId: string | null): Promise<void> {
    this._scope = scopeAccountId;
    if (!this._loaded()) {
      const { value } = await Preferences.get({ key: KEY });
      if (value) {
        try { this._items.set(JSON.parse(value)); } catch {}
      }
      this._loaded.set(true);
    }
  }

  private async persist(): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(this._items()) });
  }

  async push(input: { kind: NotifKind; title: string; body?: string; icon: string; action?: Notif['action']; accountId?: string | null }): Promise<void> {
    const notif: Notif = {
      id: this.crypto.randomId(),
      kind: input.kind,
      title: input.title,
      body: input.body,
      icon: input.icon,
      createdAt: Date.now(),
      read: false,
      action: input.action,
      accountId: input.accountId ?? this._scope,
    };
    const next = [notif, ...this._items()].slice(0, MAX);
    this._items.set(next);
    await this.persist();
  }

  async markRead(id: string): Promise<void> {
    this._items.set(this._items().map((n) => (n.id === id ? { ...n, read: true } : n)));
    await this.persist();
  }

  async markAllRead(): Promise<void> {
    this._items.set(this._items().map((n) => ({ ...n, read: true })));
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    this._items.set(this._items().filter((n) => n.id !== id));
    await this.persist();
  }

  async clear(): Promise<void> {
    this._items.set([]);
    await this.persist();
  }
}

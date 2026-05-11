import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import type { ManaColor } from '@crown/game-engine';
import { CryptoService } from '../services/crypto.service';

export interface Account {
  id: string;
  email: string;
  username: string;
  displayName: string;
  color: ManaColor;
  avatar: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

const ACCOUNTS_KEY = 'mogic.accounts';
const SESSION_KEY = 'mogic.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly crypto = inject(CryptoService);

  private readonly _accounts = signal<Account[]>([]);
  private readonly _sessionId = signal<string | null>(null);
  private readonly _loaded = signal(false);

  readonly sessionId = this._sessionId.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly me = computed(() => {
    const id = this._sessionId();
    if (!id) return null;
    const acc = this._accounts().find((a) => a.id === id);
    if (!acc) return null;
    return {
      id: acc.id,
      email: acc.email,
      username: acc.username,
      displayName: acc.displayName,
      color: acc.color,
      avatar: acc.avatar,
    };
  });
  readonly isSignedIn = computed(() => !!this.me());

  async load(): Promise<void> {
    if (this._loaded()) return;
    const [accRes, sesRes] = await Promise.all([
      Preferences.get({ key: ACCOUNTS_KEY }),
      Preferences.get({ key: SESSION_KEY }),
    ]);
    if (accRes.value) {
      try { this._accounts.set(JSON.parse(accRes.value)); } catch {}
    }
    if (sesRes.value) this._sessionId.set(sesRes.value);
    this._loaded.set(true);
  }

  private async persistAccounts(): Promise<void> {
    await Preferences.set({ key: ACCOUNTS_KEY, value: JSON.stringify(this._accounts()) });
  }

  private async setSession(id: string | null): Promise<void> {
    this._sessionId.set(id);
    if (id) await Preferences.set({ key: SESSION_KEY, value: id });
    else await Preferences.remove({ key: SESSION_KEY });
  }

  async register(input: {
    email: string;
    password: string;
    displayName: string;
    color: ManaColor;
    avatar: string;
  }): Promise<{ error: string | null }> {
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@') || email.length < 5) return { error: 'Email inválido' };
    if (input.password.length < 6) return { error: 'Contraseña mínimo 6 caracteres' };
    if (input.displayName.trim().length < 2) return { error: 'Nombre demasiado corto' };

    if (this._accounts().some((a) => a.email === email)) {
      return { error: 'Email ya registrado. Inicia sesión' };
    }

    const salt = this.crypto.randomSalt();
    const passwordHash = await this.crypto.hash(input.password, salt);

    let username = email.split('@')[0].replace(/[^a-z0-9_]/g, '');
    if (username.length < 2) username = `player${Date.now().toString(36).slice(-4)}`;
    let suffix = 0;
    while (this._accounts().some((a) => a.username === username)) {
      suffix += 1;
      username = `${email.split('@')[0]}${suffix}`;
    }

    const account: Account = {
      id: this.crypto.randomId(),
      email,
      username,
      displayName: input.displayName.trim(),
      color: input.color,
      avatar: input.avatar,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };
    this._accounts.set([...this._accounts(), account]);
    await this.persistAccounts();
    await this.setSession(account.id);
    return { error: null };
  }

  async login(email: string, password: string): Promise<{ error: string | null }> {
    const trimmed = email.trim().toLowerCase();
    const acc = this._accounts().find((a) => a.email === trimmed);
    if (!acc) return { error: 'Email o contraseña incorrectos' };
    const hash = await this.crypto.hash(password, acc.salt);
    if (hash !== acc.passwordHash) return { error: 'Email o contraseña incorrectos' };
    await this.setSession(acc.id);
    return { error: null };
  }

  async logout(): Promise<void> {
    await this.setSession(null);
  }

  async deleteAccount(): Promise<void> {
    const id = this._sessionId();
    if (!id) return;
    this._accounts.set(this._accounts().filter((a) => a.id !== id));
    await this.persistAccounts();
    await this.setSession(null);
  }

  async updateProfile(patch: Partial<Pick<Account, 'displayName' | 'color' | 'avatar'>>): Promise<void> {
    const id = this._sessionId();
    if (!id) return;
    this._accounts.set(this._accounts().map((a) => a.id === id ? { ...a, ...patch } : a));
    await this.persistAccounts();
  }
}

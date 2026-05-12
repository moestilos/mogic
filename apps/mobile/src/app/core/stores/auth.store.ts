import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import type { ManaColor } from '@crown/game-engine';
import { CryptoService } from '../services/crypto.service';
import { ApiService } from '../services/api.service';

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
  private readonly api = inject(ApiService);

  private readonly _accounts = signal<Account[]>([]);
  private readonly _remoteAdminUsers = signal<{
    id: string; email: string; username: string; displayName: string;
    color: ManaColor; avatar: string; createdAt: number;
  }[]>([]);
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

  readonly isAdmin = computed(() => {
    const me = this.me();
    if (!me) return false;
    return me.email.toLowerCase() === 'gmateosoficial@gmail.com';
  });

  /** Full accounts list. For admin: prefer remote (all users from server),
   *  fall back to local accounts when remote list is empty. */
  readonly allAccounts = computed(() => {
    const remote = this._remoteAdminUsers();
    if (remote.length > 0) return remote;
    return this._accounts().map((a) => ({
      id: a.id,
      email: a.email,
      username: a.username,
      displayName: a.displayName,
      color: a.color,
      avatar: a.avatar,
      createdAt: a.createdAt,
    }));
  });

  async adminLoadRemoteUsers(): Promise<{ error: string | null }> {
    if (!this.isAdmin()) return { error: 'no admin' };
    if (!this.api.enabled) return { error: 'api off' };
    try {
      const rows = await this.api.adminListUsers();
      this._remoteAdminUsers.set(rows.map((r) => ({
        id: r.id,
        email: r.email,
        username: r.username,
        displayName: r.displayName,
        color: r.color as ManaColor,
        avatar: r.avatar,
        createdAt: typeof r.createdAt === 'string' ? new Date(r.createdAt).getTime() : Number(r.createdAt) || Date.now(),
      })));
      return { error: null };
    } catch (e: any) {
      return { error: String(e?.message ?? e) };
    }
  }

  async adminDeleteAccount(accountId: string): Promise<void> {
    if (!this.isAdmin()) return;
    if (accountId === this._sessionId()) return; // no self-delete via admin
    this._accounts.set(this._accounts().filter((a) => a.id !== accountId));
    this._remoteAdminUsers.set(this._remoteAdminUsers().filter((a) => a.id !== accountId));
    await this.persistAccounts();
  }

  /** Other accounts on this device (excluding current session). Public-safe shape (no passwordHash). */
  readonly otherAccounts = computed(() => {
    const id = this._sessionId();
    return this._accounts()
      .filter((a) => a.id !== id)
      .map((a) => ({
        id: a.id,
        email: a.email,
        username: a.username,
        displayName: a.displayName,
        color: a.color,
        avatar: a.avatar,
      }));
  });

  /** Lookup any account by id (for invites). */
  accountById(id: string) {
    const a = this._accounts().find((x) => x.id === id);
    if (!a) return null;
    return { id: a.id, username: a.username, displayName: a.displayName, color: a.color, avatar: a.avatar };
  }

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

    // If API enabled and we have a token, restore session from server
    if (this.api.enabled) {
      await this.api.init();
      const remote = await this.api.me();
      if (remote) {
        // Mirror remote account into local accounts list (no password needed)
        const exists = this._accounts().find((a) => a.id === remote.id);
        if (!exists) {
          this._accounts.set([...this._accounts(), {
            id: remote.id,
            email: remote.email,
            username: remote.username,
            displayName: remote.displayName,
            color: remote.color,
            avatar: remote.avatar,
            passwordHash: 'remote',
            salt: 'remote',
            createdAt: Date.now(),
          }]);
          await this.persistAccounts();
        }
        await this.setSession(remote.id);
      }
    }
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

    // Remote register via API
    if (this.api.enabled) {
      try {
        const { profile } = await this.api.register({
          email, password: input.password,
          displayName: input.displayName.trim(),
          color: input.color, avatar: input.avatar,
        });
        const acc: Account = {
          id: profile.id, email: profile.email, username: profile.username,
          displayName: profile.displayName, color: profile.color as ManaColor,
          avatar: profile.avatar, passwordHash: 'remote', salt: 'remote',
          createdAt: Date.now(),
        };
        this._accounts.set([...this._accounts().filter((a) => a.id !== acc.id), acc]);
        await this.persistAccounts();
        await this.setSession(acc.id);
        return { error: null };
      } catch (e: any) {
        return { error: this.translateApiError(String(e?.message ?? e)) };
      }
    }

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

    if (this.api.enabled) {
      try {
        const { profile } = await this.api.login(trimmed, password);
        const acc: Account = {
          id: profile.id, email: profile.email, username: profile.username,
          displayName: profile.displayName, color: profile.color as ManaColor,
          avatar: profile.avatar, passwordHash: 'remote', salt: 'remote',
          createdAt: Date.now(),
        };
        this._accounts.set([...this._accounts().filter((a) => a.id !== acc.id), acc]);
        await this.persistAccounts();
        await this.setSession(acc.id);
        return { error: null };
      } catch (e: any) {
        return { error: this.translateApiError(String(e?.message ?? e)) };
      }
    }

    const acc = this._accounts().find((a) => a.email === trimmed);
    if (!acc) return { error: 'Email o contraseña incorrectos' };
    const hash = await this.crypto.hash(password, acc.salt);
    if (hash !== acc.passwordHash) return { error: 'Email o contraseña incorrectos' };
    await this.setSession(acc.id);
    return { error: null };
  }

  private translateApiError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('invalid credentials')) return 'Email o contraseña incorrectos';
    if (m.includes('already registered') || m.includes('email already')) return 'Email ya registrado';
    if (m.includes('invalid input')) return 'Datos no válidos';
    if (m.includes('jwt')) return 'Sesión expirada, vuelve a entrar';
    return msg;
  }

  async logout(): Promise<void> {
    if (this.api.enabled) await this.api.logout();
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

  async changeUsername(newUsername: string): Promise<{ error: string | null }> {
    const id = this._sessionId();
    if (!id) return { error: 'No has iniciado sesión' };
    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 2) return { error: 'Usuario mínimo 2 caracteres alfanuméricos' };
    if (clean.length > 24) return { error: 'Usuario máximo 24 caracteres' };
    if (this._accounts().some((a) => a.id !== id && a.username === clean)) {
      return { error: 'Usuario ya en uso' };
    }
    this._accounts.set(this._accounts().map((a) => a.id === id ? { ...a, username: clean } : a));
    await this.persistAccounts();
    return { error: null };
  }

  async changeEmail(newEmail: string, currentPassword: string): Promise<{ error: string | null }> {
    const id = this._sessionId();
    if (!id) return { error: 'No has iniciado sesión' };
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@') || email.length < 5) return { error: 'Email inválido' };

    const acc = this._accounts().find((a) => a.id === id);
    if (!acc) return { error: 'Cuenta no encontrada' };
    const hash = await this.crypto.hash(currentPassword, acc.salt);
    if (hash !== acc.passwordHash) return { error: 'Contraseña actual incorrecta' };

    if (this._accounts().some((a) => a.id !== id && a.email === email)) {
      return { error: 'Email ya registrado' };
    }
    this._accounts.set(this._accounts().map((a) => a.id === id ? { ...a, email } : a));
    await this.persistAccounts();
    return { error: null };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
    const id = this._sessionId();
    if (!id) return { error: 'No has iniciado sesión' };
    if (newPassword.length < 6) return { error: 'Contraseña nueva mínimo 6 caracteres' };
    const acc = this._accounts().find((a) => a.id === id);
    if (!acc) return { error: 'Cuenta no encontrada' };
    const hashOld = await this.crypto.hash(currentPassword, acc.salt);
    if (hashOld !== acc.passwordHash) return { error: 'Contraseña actual incorrecta' };
    if (currentPassword === newPassword) return { error: 'La nueva contraseña debe ser diferente' };

    const newSalt = this.crypto.randomSalt();
    const newHash = await this.crypto.hash(newPassword, newSalt);
    this._accounts.set(this._accounts().map((a) =>
      a.id === id ? { ...a, salt: newSalt, passwordHash: newHash } : a
    ));
    await this.persistAccounts();
    return { error: null };
  }
}

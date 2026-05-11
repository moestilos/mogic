import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly te = new TextEncoder();

  /** SHA-256 of `salt|password` returned as hex. */
  async hash(password: string, salt: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', this.te.encode(`${salt}|${password}`));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  randomSalt(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  randomId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

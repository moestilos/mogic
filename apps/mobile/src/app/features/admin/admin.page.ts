import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import { Preferences } from '@capacitor/preferences';
import { AuthStore } from '../../core/stores/auth.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-5xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-5 relative z-10 flex items-center justify-between gap-3">
          <button class="admin-icon-btn" (click)="back()" aria-label="Atrás">
            <crown-icon name="ChevronLeft" [size]="18"></crown-icon>
          </button>
          <div class="text-center">
            <div class="crown-hud">Admin · gated</div>
            <h1 class="crown-display text-2xl mt-1">Panel administrador</h1>
          </div>
          <button class="admin-icon-btn" (click)="refresh()" aria-label="Refrescar">
            <crown-icon name="RotateCw" [size]="16"></crown-icon>
          </button>
        </header>

        @if (!auth.isAdmin()) {
          <div class="crown-card text-center p-10 relative z-10">
            <crown-icon name="Lock" [size]="48" cls="crown-text-danger"></crown-icon>
            <p class="crown-display text-xl mt-3 mb-1">Acceso denegado</p>
            <p class="crown-text-lo text-sm">Esta zona requiere cuenta admin.</p>
            <button class="crown-btn mt-4 px-5 py-3 text-xs uppercase tracking-widest"
                    (click)="back()">Volver</button>
          </div>
        } @else {
          <!-- KPI strip -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 relative z-10">
            <div class="kpi-card">
              <div class="kpi-icon"><crown-icon name="Users" [size]="14" cls="crown-text-mid"></crown-icon></div>
              <div class="kpi-num">{{ totalAccounts() }}</div>
              <div class="kpi-label">Cuentas</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon"><crown-icon name="UserPlus" [size]="14" cls="crown-text-mid"></crown-icon></div>
              <div class="kpi-num">{{ newLast7d() }}</div>
              <div class="kpi-label">+7d</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon"><crown-icon name="Trophy" [size]="14" cls="crown-text-accent"></crown-icon></div>
              <div class="kpi-num">{{ totalGroups() }}</div>
              <div class="kpi-label">Grupos</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon"><crown-icon name="Dices" [size]="14" cls="crown-text-mid"></crown-icon></div>
              <div class="kpi-num">{{ totalGames() }}</div>
              <div class="kpi-label">Partidas</div>
            </div>
          </div>

          <!-- Search -->
          <div class="admin-search mb-4 relative z-10">
            <crown-icon name="Search" [size]="14" cls="crown-text-lo"></crown-icon>
            <input class="admin-search-input"
                   [value]="search()"
                   (input)="search.set($any($event.target).value)"
                   placeholder="Buscar por email, usuario, nombre..." />
            @if (search().length > 0) {
              <button class="crown-btn-ghost" (click)="search.set('')" aria-label="Limpiar">
                <crown-icon name="X" [size]="13"></crown-icon>
              </button>
            }
          </div>

          <!-- Users table -->
          <div class="admin-section relative z-10">
            <div class="admin-section-head">
              <div class="crown-hud flex items-center gap-1.5">
                <crown-icon name="Users" [size]="11"></crown-icon> Usuarios registrados
              </div>
              <div class="crown-text-lo text-xs" style="font-family: var(--font-hud);">
                {{ filteredAccounts().length }} de {{ totalAccounts() }}
              </div>
            </div>
            @if (filteredAccounts().length === 0) {
              <div class="admin-empty">
                <p class="crown-text-lo">Sin resultados</p>
              </div>
            }
            <div class="admin-table">
              @for (a of filteredAccounts(); track a.id) {
                <div class="admin-row" [class.is-self]="a.id === auth.sessionId()">
                  <div class="admin-row-avatar">
                    <crown-icon [name]="$any(a.avatar)" [size]="20"></crown-icon>
                  </div>
                  <div class="crown-pip" [ngClass]="a.color | lowercase"></div>
                  <div class="admin-row-info">
                    <div class="admin-row-name">
                      {{ a.displayName }}
                      @if (a.email === 'gmateosoficial&#64;gmail.com') {
                        <span class="admin-badge">admin</span>
                      }
                      @if (a.id === auth.sessionId()) {
                        <span class="admin-badge admin-badge-self">tú</span>
                      }
                    </div>
                    <div class="admin-row-meta">
                      <span>&#64;{{ a.username }}</span>
                      <span class="admin-row-sep">·</span>
                      <span>{{ a.email }}</span>
                    </div>
                    <div class="admin-row-date">
                      <crown-icon name="ChevronLeft" [size]="9"></crown-icon>
                      registrado {{ formatDate(a.createdAt) }}
                    </div>
                  </div>
                  <button class="admin-row-del"
                          [disabled]="a.id === auth.sessionId()"
                          (click)="confirmDelete(a.id, a.displayName)"
                          [title]="a.id === auth.sessionId() ? 'No puedes eliminar tu propia cuenta' : 'Eliminar cuenta'">
                    <crown-icon name="Trash2" [size]="14"></crown-icon>
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Storage stats -->
          <div class="admin-section mt-5 relative z-10">
            <div class="admin-section-head">
              <div class="crown-hud flex items-center gap-1.5">
                <crown-icon name="Box" [size]="11"></crown-icon> Almacenamiento local
              </div>
            </div>
            <div class="admin-table">
              @for (s of storageRows(); track s.key) {
                <div class="admin-row admin-row-storage">
                  <div class="admin-row-info">
                    <div class="admin-row-name" style="font-family: var(--font-hud); font-size: 12px;">{{ s.key }}</div>
                    <div class="admin-row-meta">{{ s.size }} bytes</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Confirm modal -->
        @if (deleteTarget() !== null) {
          <div class="fixed inset-0 z-[70] flex items-center justify-center p-4" (click)="deleteTarget.set(null)">
            <div class="confirm-backdrop"></div>
            <div class="confirm-modal" (click)="$event.stopPropagation()">
              <div class="confirm-icon">
                <crown-icon name="Skull" [size]="36" cls="crown-text-danger"></crown-icon>
              </div>
              <div class="confirm-title">¿Eliminar {{ deleteTarget()?.name }}?</div>
              <p class="confirm-body">Acción irreversible. Borra la cuenta de este dispositivo.</p>
              <div class="confirm-actions">
                <button class="crown-btn flex-1 py-3 text-xs uppercase tracking-widest"
                        (click)="deleteTarget.set(null)">Cancelar</button>
                <button class="crown-btn-danger flex-1 py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        (click)="deleteConfirmed()">
                  <crown-icon name="Trash2" [size]="13"></crown-icon> Eliminar
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .admin-icon-btn {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--divider);
      border-radius: 10px;
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease, transform 120ms ease;
    }
    .admin-icon-btn:active { transform: scale(0.94); }
    [data-theme='brutal'] .admin-icon-btn { border-radius: 0; border-width: 1.5px; }
    [data-theme='stark']  .admin-icon-btn { background: rgba(20,20,14,0.04); }

    .kpi-card {
      padding: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .kpi-card { background: #ffffff; }
    .kpi-icon {
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .kpi-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 28px;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi);
      line-height: 1;
    }
    .kpi-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 5px;
    }

    .admin-search {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 14px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--input-radius);
    }
    .admin-search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text-hi); font-family: var(--font-name); font-size: 14px;
    }
    .admin-search-input::placeholder { color: var(--text-lo); }

    .admin-section { background: transparent; }
    .admin-section-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }
    .admin-table {
      display: flex; flex-direction: column;
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
      overflow: hidden;
    }
    [data-theme='stark'] .admin-table { background: #ffffff; }
    .admin-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--divider);
      background: rgba(255,255,255,0.02);
    }
    [data-theme='stark'] .admin-row { background: #ffffff; }
    .admin-row:last-child { border-bottom: none; }
    .admin-row.is-self {
      background: rgba(179,157,255,0.04);
      border-left: 2px solid var(--accent-flat);
      padding-left: 12px;
    }
    .admin-row-avatar {
      width: 36px; height: 36px;
      background: var(--bg-input);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-hi);
      flex-shrink: 0;
    }
    [data-theme='brutal'] .admin-row-avatar { border-radius: 0; }
    .admin-row-info { flex: 1; min-width: 0; }
    .admin-row-name {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 14px;
      color: var(--text-hi);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .admin-row-meta {
      font-family: var(--font-hud);
      font-size: 10px;
      color: var(--text-lo);
      letter-spacing: 0.04em;
      margin-top: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .admin-row-sep { margin: 0 6px; opacity: 0.4; }
    .admin-row-date {
      display: inline-flex; align-items: center; gap: 4px;
      font-family: var(--font-hud);
      font-size: 9px;
      color: var(--text-lo);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .admin-row-del {
      background: transparent;
      border: 1px solid var(--divider);
      color: var(--text-lo);
      width: 34px; height: 34px;
      border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    .admin-row-del:hover:not(:disabled) { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); }
    .admin-row-del:disabled { opacity: 0.3; cursor: not-allowed; }

    .admin-badge {
      font-family: var(--font-hud);
      font-size: 8px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 99px;
      background: linear-gradient(115deg, #ff9ed0, #b39dff, #9dd2ff, #9dffb3, #ffe89d);
      background-size: 300% 100%;
      color: #08080a;
      animation: chromeFlow 5s linear infinite;
      font-weight: 700;
    }
    .admin-badge-self {
      background: rgba(255,255,255,0.1);
      color: var(--text-mid);
      animation: none;
    }

    .admin-empty {
      padding: 24px;
      text-align: center;
      background: rgba(255,255,255,0.02);
      border: 1px dashed var(--divider);
      border-radius: var(--pod-radius);
    }

    .admin-row-storage { padding: 10px 14px; }

    /* Confirm modal */
    .confirm-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(8px);
      z-index: 0;
    }
    .confirm-modal {
      position: relative; z-index: 1;
      width: 100%; max-width: 24rem;
      padding: 24px;
      background: #0c0c12;
      border: 1px solid rgba(255,122,122,0.4);
      border-radius: 16px;
      text-align: center;
      color: #e8e8f0;
    }
    .confirm-icon { margin-bottom: 12px; display: flex; justify-content: center; }
    .confirm-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 18px;
      color: #f5f5fa;
      margin-bottom: 6px;
    }
    .confirm-body {
      font-size: 12px;
      color: #9999a8;
      margin-bottom: 18px;
    }
    .confirm-actions { display: flex; gap: 8px; }
  `],
})
export class AdminPage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly search = signal('');
  readonly deleteTarget = signal<{ id: string; name: string } | null>(null);
  readonly storageRows = signal<{ key: string; size: number }[]>([]);
  readonly totalGroups = signal(0);
  readonly totalGames = signal(0);

  readonly totalAccounts = computed(() => this.auth.allAccounts().length);
  readonly newLast7d = computed(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.auth.allAccounts().filter((a) => a.createdAt >= cutoff).length;
  });
  readonly filteredAccounts = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sorted = [...this.auth.allAccounts()].sort((a, b) => b.createdAt - a.createdAt);
    if (!q) return sorted;
    return sorted.filter((a) =>
      a.email.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.displayName.toLowerCase().includes(q)
    );
  });

  async ngOnInit() {
    await this.auth.load();
    if (!this.auth.isAdmin()) return;
    await this.refresh();
  }

  async refresh() {
    void this.haptics.light();
    // Pull all registered users from server (admin only). Falls back to local list.
    await this.auth.adminLoadRemoteUsers();
    const rows: { key: string; size: number }[] = [];
    let groups = 0, games = 0;
    const keys = ['mogic.accounts', 'mogic.session', 'mogic.friendRequests', 'mogic.notifications',
                  'crown.groups', 'crown.groupResults', 'crown.history', 'crown.theme', 'crown.themeChosen'];
    for (const k of keys) {
      const { value } = await Preferences.get({ key: k });
      if (value) {
        rows.push({ key: k, size: value.length });
        if (k === 'crown.groups') { try { groups = JSON.parse(value).length; } catch {} }
        if (k === 'crown.groupResults') { try { games = JSON.parse(value).length; } catch {} }
      }
    }
    this.storageRows.set(rows);
    this.totalGroups.set(groups);
    this.totalGames.set(games);
  }

  confirmDelete(id: string, name: string) {
    if (id === this.auth.sessionId()) return;
    void this.haptics.warning();
    this.deleteTarget.set({ id, name });
  }

  async deleteConfirmed() {
    const t = this.deleteTarget();
    if (!t) return;
    void this.haptics.heavy();
    await this.auth.adminDeleteAccount(t.id);
    this.deleteTarget.set(null);
    await this.refresh();
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  back() { void this.router.navigate(['/']); }
}

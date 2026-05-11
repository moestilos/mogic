import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsStore } from '../core/stores/notifications.store';
import { AuthStore } from '../core/stores/auth.store';
import { HapticsService } from '../core/services/haptics.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-start justify-end" (click)="close.emit()">
      <div class="notif-backdrop"></div>

      <div class="notif-panel relative w-full max-w-sm h-full md:max-h-[80vh] md:my-12 md:mr-6 md:rounded-2xl overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        <header class="flex items-center justify-between px-5 py-4 border-b"
                style="border-color: rgba(255,255,255,0.08);">
          <div>
            <div class="notif-eyebrow">Notificaciones</div>
            <div class="notif-title">
              @if (store.unread() > 0) { {{ store.unread() }} sin leer } @else { Todo al día }
            </div>
          </div>
          <button class="notif-close" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="18"></crown-icon>
          </button>
        </header>

        <div class="flex-1 overflow-y-auto">
          @if (store.items().length === 0) {
            <div class="text-center py-16 px-6">
              <crown-icon name="Sparkles" [size]="40" [strokeWidth]="1.25" cls="notif-empty-icon"></crown-icon>
              <p class="notif-empty-title">Sin notificaciones</p>
              <p class="notif-empty-sub">Las invitaciones a partidas, victorias de amigos y otros eventos aparecerán aquí.</p>
            </div>
          }
          @for (n of store.items(); track n.id) {
            <div class="notif-row" [class.is-unread]="!n.read" (click)="open(n)">
              <div class="notif-icon">
                <crown-icon [name]="$any(n.icon)" [size]="18"></crown-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="notif-row-title">{{ n.title }}</div>
                @if (n.body) {
                  <div class="notif-row-body">{{ n.body }}</div>
                }
                <div class="notif-row-meta">{{ formatTime(n.createdAt) }}</div>
              </div>
              <button class="notif-row-del" (click)="$event.stopPropagation(); remove(n.id)" aria-label="Eliminar">
                <crown-icon name="X" [size]="14"></crown-icon>
              </button>
            </div>
          }
        </div>

        @if (store.items().length > 0) {
          <footer class="flex items-center justify-between px-5 py-3 border-t gap-2"
                  style="border-color: rgba(255,255,255,0.08);">
            <button class="notif-action" (click)="markAll()">
              <crown-icon name="Check" [size]="13"></crown-icon> Marcar leídas
            </button>
            <button class="notif-action notif-action-danger" (click)="clearAll()">
              <crown-icon name="Trash2" [size]="13"></crown-icon> Limpiar
            </button>
          </footer>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .notif-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 0;
    }
    .notif-panel {
      position: relative;
      z-index: 1;
      background: #0c0c12;
      border-left: 1px solid rgba(255,255,255,0.1);
      color: #e8e8f0;
    }
    @media (min-width: 768px) {
      .notif-panel { border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; }
    }

    .notif-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #7a7a90;
    }
    .notif-title {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 500;
      font-size: 16px;
      margin-top: 4px;
      color: #f5f5fa;
    }
    .notif-close {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #c4c4d0;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .notif-close:hover { background: rgba(255,255,255,0.1); }

    .notif-empty-icon { color: #6e6e7e; }
    .notif-empty-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      color: #c4c4d0;
      margin-top: 12px;
    }
    .notif-empty-sub {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #7a7a90;
      margin-top: 6px;
      line-height: 1.45;
    }

    .notif-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 160ms ease;
    }
    .notif-row:hover { background: rgba(255,255,255,0.03); }
    .notif-row.is-unread {
      background: rgba(179,157,255,0.04);
      border-left: 2px solid #b39dff;
      padding-left: 14px;
    }
    .notif-icon {
      width: 32px; height: 32px;
      background: rgba(179,157,255,0.1);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      color: #b39dff;
    }
    .notif-row-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #e8e8f0;
      line-height: 1.3;
    }
    .notif-row-body {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #9999a8;
      margin-top: 2px;
      line-height: 1.4;
    }
    .notif-row-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #6e6e7e;
      margin-top: 6px;
    }
    .notif-row-del {
      background: transparent;
      border: none;
      color: #6e6e7e;
      cursor: pointer;
      padding: 4px;
    }
    .notif-row-del:hover { color: #ff7a7a; }

    .notif-action {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: #c4c4d0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
    }
    .notif-action:hover { background: rgba(255,255,255,0.08); }
    .notif-action-danger:hover { color: #ff7a7a; border-color: rgba(255,122,122,0.4); }
  `],
})
export class NotificationsPanelComponent implements OnInit {
  readonly store = inject(NotificationsStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);
  @Output() readonly close = new EventEmitter<void>();

  async ngOnInit() {
    const me = this.auth.me();
    await this.store.load(me?.id ?? null);
  }

  async open(n: { id: string; read: boolean; action?: { route: string; params?: Record<string, string> } }) {
    if (!n.read) await this.store.markRead(n.id);
    void this.haptics.light();
    if (n.action) {
      void this.router.navigate([n.action.route], n.action.params ? { queryParams: n.action.params } : {});
      this.close.emit();
    }
  }

  async remove(id: string) {
    void this.haptics.warning();
    await this.store.remove(id);
  }

  async markAll() {
    void this.haptics.medium();
    await this.store.markAllRead();
  }

  async clearAll() {
    void this.haptics.warning();
    await this.store.clear();
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'ahora';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
}

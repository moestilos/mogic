import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { GameFormat, ManaColor } from '@crown/game-engine';
import { GameStore } from '../../core/stores/game.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { AuthStore } from '../../core/stores/auth.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

type GameMode = 'real' | 'casual';
const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

interface Slot {
  name: string;
  color: ManaColor;
  avatar: string;
  /** Either 'me' (your own profile) or the friend.id from ProfileStore. Null = empty. */
  source: 'me' | { friendId: string } | null;
}

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-2xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-5 relative z-10">
          <button class="crown-btn-ghost text-sm mb-2 flex items-center gap-1" (click)="back()">
            <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Atrás
          </button>
          <h1 class="crown-display text-4xl">Nueva partida</h1>
        </header>

        <!-- MODE TOGGLE: real / casual -->
        <section class="mb-5 relative z-10">
          <div class="crown-hud mb-3 flex items-center gap-1.5">
            <crown-icon name="Users" [size]="11"></crown-icon> Modo
          </div>
          <div class="mode-toggle">
            <button class="mode-btn"
                    [class.is-on]="mode() === 'real'"
                    (click)="setMode('real')">
              <crown-icon name="UserPlus" [size]="14"></crown-icon>
              <div class="mode-btn-body">
                <div class="mode-btn-title">Amigos reales</div>
                <div class="mode-btn-sub">Las wins cuentan en stats</div>
              </div>
            </button>
            <button class="mode-btn"
                    [class.is-on]="mode() === 'casual'"
                    (click)="setMode('casual')">
              <crown-icon name="Dice5" [size]="14"></crown-icon>
              <div class="mode-btn-body">
                <div class="mode-btn-title">Casual / inventados</div>
                <div class="mode-btn-sub">Solo jugar, sin tracking</div>
              </div>
            </button>
          </div>
        </section>

        <section class="mb-5 relative z-10">
          <div class="crown-hud mb-3">Jugadores</div>
          <div class="flex gap-2">
            @for (n of counts; track n) {
              <button class="flex-1 py-4"
                      [class]="count() === n ? 'crown-btn-primary' : 'crown-btn'"
                      (click)="setCount(n)">{{ n }}</button>
            }
          </div>
        </section>

        <section class="mb-5 relative z-10">
          <div class="crown-hud mb-3">Formato</div>
          <div class="grid grid-cols-2 gap-2">
            @for (f of formats; track f.id) {
              <button class="py-4 px-4 text-left"
                      [class]="format() === f.id ? 'crown-btn-primary' : 'crown-btn'"
                      (click)="format.set(f.id)">
                <div class="text-base" style="font-family: var(--font-name); font-weight: 600;">{{ f.label }}</div>
                <div class="text-[10px] mt-0.5 opacity-70" style="font-family: var(--font-hud); letter-spacing: 0.18em;">{{ f.life }} LIFE</div>
              </button>
            }
          </div>
        </section>

        <section class="mb-5 flex-1 relative z-10">
          <div class="flex items-center justify-between mb-3">
            <div class="crown-hud">Mesa</div>
            <div class="crown-text-lo text-xs" style="font-family: var(--font-hud);">
              {{ filledCount() }}/{{ count() }}
            </div>
          </div>

          <!-- REAL MODE -->
          @if (mode() === 'real') {
            <div class="flex flex-col gap-2">
              @for (s of slots(); track $index; let i = $index) {
                <div class="slot" [class.slot--empty]="!s.source" [class.slot--locked]="s.source === 'me'">
                  <div class="slot-index">{{ i + 1 }}</div>
                  @if (s.source) {
                    <div class="slot-avatar">
                      <crown-icon [name]="$any(s.avatar)" [size]="18"></crown-icon>
                    </div>
                    <div class="crown-pip" [ngClass]="s.color | lowercase"></div>
                    <div class="flex-1 min-w-0">
                      <div class="slot-name">{{ s.name }}</div>
                      <div class="slot-tag">
                        @if (s.source === 'me') { Tú · cuenta } @else { Amigo }
                      </div>
                    </div>
                    @if (s.source !== 'me') {
                      <button class="crown-btn-ghost px-2 py-1" (click)="clearSlot(i)" aria-label="Quitar">
                        <crown-icon name="X" [size]="14"></crown-icon>
                      </button>
                    }
                  } @else {
                    <button class="slot-empty-btn" (click)="openPickerFor(i)">
                      <crown-icon name="UserPlus" [size]="14"></crown-icon>
                      <span>Seleccionar amigo</span>
                    </button>
                  }
                </div>
              }
            </div>

            @if (availableFriends().length === 0 && needsMoreFriends()) {
              <div class="empty-card mt-4">
                <crown-icon name="Users" [size]="36" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
                <p class="empty-title">Necesitas amigos</p>
                <p class="empty-sub">O cambia a modo Casual para jugar con nombres inventados.</p>
                <div class="flex gap-2 justify-center mt-3">
                  <button class="crown-btn px-4 py-2 text-[11px] uppercase tracking-widest"
                          (click)="setMode('casual')">Casual</button>
                  <button class="crown-btn-primary px-4 py-2 text-[11px] uppercase tracking-widest flex items-center gap-1"
                          (click)="goAddFriends()">
                    <crown-icon name="UserPlus" [size]="11"></crown-icon> Añadir amigos
                  </button>
                </div>
              </div>
            }
          }

          <!-- CASUAL MODE -->
          @if (mode() === 'casual') {
            <div class="flex flex-col gap-2">
              @for (s of slots(); track $index; let i = $index) {
                <div class="slot slot--casual">
                  <div class="slot-index">{{ i + 1 }}</div>
                  <button class="crown-color-swatch" [ngClass]="s.color | lowercase"
                          style="width:28px;height:28px;"
                          (click)="cycleColorCasual(i)"
                          aria-label="Cambiar color"></button>
                  <input class="slot-input"
                         [value]="s.name"
                         (input)="renameCasual(i, $any($event.target).value)"
                         placeholder="Nombre"
                         maxlength="20" />
                </div>
              }
            </div>

            <div class="casual-note mt-3">
              <crown-icon name="Star" [size]="12"></crown-icon>
              <span>Las victorias <b>no contarán</b> para wins ni stats de amigos.</span>
            </div>
          }
        </section>

        <button class="crown-btn-primary w-full py-5 text-base uppercase tracking-widest relative z-10"
                [disabled]="!canStart()"
                (click)="start()">
          @if (canStart()) {
            Empezar partida
          } @else if (mode() === 'real') {
            Faltan {{ count() - filledCount() }} jugador{{ count() - filledCount() === 1 ? '' : 'es' }}
          } @else {
            Rellena los nombres
          }
        </button>

        <!-- Friend picker modal (only real mode) -->
        @if (pickerOpen() !== null) {
          <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center" (click)="pickerOpen.set(null)">
            <div class="picker-backdrop"></div>
            <div class="picker-modal" (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="crown-hud">Slot {{ (pickerOpen() ?? 0) + 1 }}</div>
                  <div class="picker-title">Elige amigo</div>
                </div>
                <button class="profile-icon-btn" (click)="pickerOpen.set(null)" aria-label="Cerrar">
                  <crown-icon name="X" [size]="16"></crown-icon>
                </button>
              </div>

              @if (availableFriends().length === 0) {
                <div class="empty-card">
                  <crown-icon name="Users" [size]="32" cls="crown-text-lo"></crown-icon>
                  <p class="empty-title">Sin amigos disponibles</p>
                  <p class="empty-sub">Ya están todos en la mesa o no tienes amigos añadidos.</p>
                </div>
              } @else {
                <div class="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  @for (f of availableFriends(); track f.id) {
                    <button class="friend-row" (click)="assign(f)">
                      <div class="slot-avatar">
                        <crown-icon [name]="$any(f.avatar)" [size]="18"></crown-icon>
                      </div>
                      <div class="crown-pip" [ngClass]="f.color | lowercase"></div>
                      <div class="flex-1 min-w-0 text-left">
                        <div class="slot-name">{{ f.name }}</div>
                        <div class="slot-tag">{{ f.wins }}W · {{ f.games }}G</div>
                      </div>
                      <crown-icon name="ChevronLeft" [size]="14" cls="crown-text-lo" style="transform: rotate(180deg);"></crown-icon>
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .mode-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .mode-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
      color: var(--text-mid);
      cursor: pointer;
      text-align: left;
      transition: background 160ms ease, border-color 160ms ease, transform 100ms ease;
    }
    .mode-btn:active { transform: scale(0.98); }
    .mode-btn:hover { background: rgba(255,255,255,0.06); }
    [data-theme='stark'] .mode-btn { background: rgba(20,20,14,0.03); }
    .mode-btn.is-on {
      background: var(--accent);
      color: var(--accent-text);
      border-color: transparent;
    }
    [data-theme='chrome'] .mode-btn.is-on {
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    .mode-btn-body { flex: 1; min-width: 0; }
    .mode-btn-title {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 13px;
      line-height: 1.2;
    }
    .mode-btn-sub {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.7;
      margin-top: 2px;
    }

    .slot {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .slot { background: rgba(20,20,14,0.03); }
    .slot--empty { border-style: dashed; background: rgba(255,255,255,0.01); }
    .slot--locked { border-color: var(--accent-flat); box-shadow: var(--accent-glow); }
    .slot--casual { gap: 12px; }
    .slot-index {
      width: 24px; height: 24px;
      border-radius: 99px;
      background: var(--bg-input);
      color: var(--text-lo);
      font-family: var(--font-hud);
      font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .slot-avatar {
      width: 32px; height: 32px;
      background: var(--bg-input);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-hi);
      flex-shrink: 0;
    }
    [data-theme='brutal'] .slot-avatar { border-radius: 0; }
    .slot-name {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 14px;
      color: var(--text-hi);
    }
    .slot-tag {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 2px;
    }
    .slot-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-hi);
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 15px;
    }
    .slot-input::placeholder { color: var(--text-lo); }
    .slot-empty-btn {
      flex: 1;
      display: flex; align-items: center; gap: 8px;
      background: transparent;
      border: none;
      color: var(--text-mid);
      cursor: pointer;
      padding: 4px 0;
      font-family: var(--font-name);
      font-size: 14px;
      font-weight: 500;
    }
    .slot-empty-btn:hover { color: var(--text-hi); }

    .casual-note {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: rgba(255,213,106,0.06);
      border: 1px dashed var(--warn);
      border-radius: var(--input-radius);
      color: var(--warn);
      font-size: 12px;
      font-family: var(--font-body);
    }
    .casual-note b { color: var(--text-hi); }

    .empty-card {
      text-align: center; padding: 24px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='brutal'] .empty-card { border-radius: 0; border-style: solid; border-width: 1.5px; }
    .empty-title {
      font-family: var(--font-display); font-weight: var(--life-weight);
      font-size: 16px; color: var(--text-mid); margin-top: 10px;
    }
    .empty-sub { font-size: 12px; color: var(--text-lo); margin-top: 4px; line-height: 1.45; }

    .picker-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .picker-modal {
      position: relative; z-index: 1;
      width: 100%; max-width: 28rem;
      max-height: 88vh;
      padding: 22px;
      background: #0c0c12;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 22px 22px 0 0;
      color: #e8e8f0;
      overflow-y: auto;
    }
    @media (min-width: 768px) { .picker-modal { border-radius: 22px; margin-bottom: 2rem; } }
    .picker-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 20px;
      letter-spacing: -0.02em;
      margin-top: 4px;
      color: #f5f5fa;
    }
    .profile-icon-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #c4c4d0;
      cursor: pointer;
    }
    .friend-row {
      width: 100%;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: background 160ms ease, transform 100ms ease;
    }
    .friend-row:hover { background: rgba(255,255,255,0.06); }
    .friend-row:active { transform: scale(0.99); }
  `],
})
export class NewGamePage implements OnInit {
  private readonly store = inject(GameStore);
  readonly profile = inject(ProfileStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly counts = [2, 3, 4, 5, 6];
  readonly formats: { id: GameFormat; label: string; life: number }[] = [
    { id: 'commander', label: 'Commander', life: 40 },
    { id: 'standard', label: 'Standard', life: 20 },
    { id: 'brawl', label: 'Brawl', life: 25 },
    { id: 'oathbreaker', label: 'Oathbreaker', life: 20 },
  ];

  readonly mode = signal<GameMode>('real');
  readonly count = signal(4);
  readonly format = signal<GameFormat>('commander');
  readonly slots = signal<Slot[]>([]);
  readonly pickerOpen = signal<number | null>(null);

  readonly filledCount = computed(() => {
    const m = this.mode();
    if (m === 'casual') return this.slots().filter((s) => s.name.trim().length > 0).length;
    return this.slots().filter((s) => s.source !== null).length;
  });

  readonly assignedFriendIds = computed(() => {
    const ids: string[] = [];
    for (const s of this.slots()) {
      if (typeof s.source === 'object' && s.source !== null && 'friendId' in s.source) {
        ids.push(s.source.friendId);
      }
    }
    return ids;
  });

  readonly availableFriends = computed(() => {
    const assigned = new Set(this.assignedFriendIds());
    return this.profile.friends().filter((f) => !assigned.has(f.id));
  });

  readonly needsMoreFriends = computed(() => {
    const need = this.count() - 1;
    return this.profile.friends().length < need;
  });

  async ngOnInit() {
    await this.auth.load();
    const me = this.auth.me();
    await this.profile.setScope(me?.id ?? null);
    await this.profile.load();
    this.initSlots(this.count());
  }

  setMode(m: GameMode) {
    if (this.mode() === m) return;
    void this.haptics.medium();
    this.mode.set(m);
    this.initSlots(this.count());
  }

  private initSlots(n: number) {
    const me = this.auth.me();
    const arr: Slot[] = [];
    if (this.mode() === 'real') {
      if (me) arr.push({ name: me.displayName, color: me.color, avatar: me.avatar, source: 'me' });
      while (arr.length < n) arr.push({ name: '', color: 'C', avatar: 'User', source: null });
    } else {
      // Casual: prefill first slot with user name if available, rest with Player N
      if (me) arr.push({ name: me.displayName, color: me.color, avatar: me.avatar, source: null });
      for (let i = arr.length; i < n; i++) {
        arr.push({ name: `Player ${i + 1}`, color: COLORS[i % COLORS.length], avatar: 'User', source: null });
      }
    }
    this.slots.set(arr);
  }

  setCount(n: number) {
    void this.haptics.light();
    const current = this.slots();
    const next: Slot[] = [];
    for (let i = 0; i < n; i++) {
      if (i < current.length) next.push(current[i]);
      else if (this.mode() === 'casual') {
        next.push({ name: `Player ${i + 1}`, color: COLORS[i % COLORS.length], avatar: 'User', source: null });
      } else {
        next.push({ name: '', color: 'C', avatar: 'User', source: null });
      }
    }
    if (this.mode() === 'real' && next.length > 0 && next[0].source !== 'me') {
      const me = this.auth.me();
      if (me) next[0] = { name: me.displayName, color: me.color, avatar: me.avatar, source: 'me' };
    }
    this.count.set(n);
    this.slots.set(next);
  }

  openPickerFor(idx: number) {
    void this.haptics.light();
    this.pickerOpen.set(idx);
  }

  assign(f: { id: string; name: string; color: ManaColor; avatar: string }) {
    const idx = this.pickerOpen();
    if (idx === null) return;
    void this.haptics.medium();
    const arr = [...this.slots()];
    arr[idx] = { name: f.name, color: f.color, avatar: f.avatar, source: { friendId: f.id } };
    this.slots.set(arr);
    this.pickerOpen.set(null);
  }

  clearSlot(idx: number) {
    void this.haptics.warning();
    const arr = [...this.slots()];
    arr[idx] = { name: '', color: 'C', avatar: 'User', source: null };
    this.slots.set(arr);
  }

  renameCasual(idx: number, name: string) {
    const arr = [...this.slots()];
    arr[idx] = { ...arr[idx], name };
    this.slots.set(arr);
  }

  cycleColorCasual(idx: number) {
    void this.haptics.light();
    const arr = [...this.slots()];
    const i = COLORS.indexOf(arr[idx].color);
    arr[idx] = { ...arr[idx], color: COLORS[(i + 1) % COLORS.length] };
    this.slots.set(arr);
  }

  canStart(): boolean {
    if (this.mode() === 'casual') {
      return this.slots().every((s) => s.name.trim().length > 0);
    }
    return this.filledCount() === this.count();
  }

  back() { void this.router.navigate(['/']); }
  goAddFriends() { void this.router.navigate(['/profile'], { queryParams: { tab: 'search' } }); }

  start() {
    if (!this.canStart()) return;
    void this.haptics.medium();
    const slots = this.slots();
    this.store.start({
      format: this.format(),
      players: slots.map((s) => ({ name: s.name.trim() || `Player`, color: s.color })),
    });
    const snap = this.store.game();
    sessionStorage.setItem('crown.gameMode', this.mode());
    if (snap && this.mode() === 'real') {
      const mapping: Record<string, string> = {};
      snap.players.forEach((p, i) => {
        const src = slots[i]?.source;
        if (typeof src === 'object' && src !== null && 'friendId' in src) {
          mapping[p.id] = src.friendId;
        }
      });
      sessionStorage.setItem('crown.playerToFriend', JSON.stringify(mapping));
    } else {
      sessionStorage.removeItem('crown.playerToFriend');
    }
    void this.router.navigate(['/game']);
  }
}

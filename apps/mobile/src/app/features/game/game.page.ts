import { Component, computed, effect, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import type { CounterType, ManaColor, Player } from '@crown/game-engine';
import { GameStore } from '../../core/stores/game.store';
import { GroupsStore } from '../../core/stores/groups.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { HapticsService } from '../../core/services/haptics.service';
import { CounterDrawerComponent } from './counter-drawer.component';
import { CmdDamageMatrixComponent } from './cmd-damage-matrix.component';
import { ThemePickerComponent } from '../../shared/theme-picker.component';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { MagicGuideComponent } from '../../shared/magic-guide.component';

const PIP: Record<ManaColor, string> = { W: 'w', U: 'u', B: 'b', R: 'r', G: 'g', C: 'c' };

const GLOW: Record<ManaColor, string> = {
  W: 'rgba(248, 233, 180, 0.45)',
  U: 'rgba(120, 180, 230, 0.45)',
  B: 'rgba(150, 120, 180, 0.45)',
  R: 'rgba(210, 79, 69, 0.45)',
  G: 'rgba(90, 154, 76, 0.45)',
  C: 'rgba(200, 200, 212, 0.4)',
};

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [IonContent, CounterDrawerComponent, CmdDamageMatrixComponent, ThemePickerComponent, AnimatedBackgroundComponent, IconComponent, MagicGuideComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="h-screen w-screen flex flex-col overflow-hidden relative" style="background: var(--bg-base); padding-top: env(safe-area-inset-top, 0); padding-left: env(safe-area-inset-left, 0); padding-right: env(safe-area-inset-right, 0);">

        <app-animated-background></app-animated-background>

        <div class="flex-1 grid gap-1.5 p-1.5 min-h-0 relative z-10"
             [style.grid-template-columns]="gridCols()"
             [style.grid-template-rows]="gridRows()">
          @for (p of store.players(); track p.id; let i = $index) {
            <div
              class="crown-pod relative min-w-0 min-h-0 overflow-hidden select-none touch-manipulation"
              [class.is-out]="p.eliminated"
              [style.--pod-glow]="glowFor(p.color)">

              <!-- Top half tap zone: +1 -->
              <div
                class="absolute inset-x-0 top-0 h-1/2 z-10 cursor-pointer"
                [class.tap-flash]="flashPid() === p.id + ':+'"
                (pointerdown)="onPodPointerDown(p, +1, $event)"
                (pointerup)="onPodPointerUp(p, +1, $event)"
                (pointerleave)="onPodPointerCancel()"
                (pointercancel)="onPodPointerCancel()"
                role="button"
                [attr.aria-label]="'Add life ' + p.name"></div>

              <!-- Bottom half tap zone: -1 -->
              <div
                class="absolute inset-x-0 bottom-0 h-1/2 z-10 cursor-pointer"
                [class.tap-flash]="flashPid() === p.id + ':-'"
                (pointerdown)="onPodPointerDown(p, -1, $event)"
                (pointerup)="onPodPointerUp(p, -1, $event)"
                (pointerleave)="onPodPointerCancel()"
                (pointercancel)="onPodPointerCancel()"
                role="button"
                [attr.aria-label]="'Lose life ' + p.name"></div>

              <!-- Sigil card roman cap (only visible on sigil theme) -->
              <div class="crown-pod-cap" aria-hidden="true">{{ romanFor($index) }}</div>

              <!-- Content (no pointer events) -->
              <div class="absolute inset-0 flex flex-col pointer-events-none px-3 py-2.5">
                <div class="flex items-center justify-center">
                  <div class="crown-pod-name text-[11px] truncate" style="font-weight: 500; letter-spacing: 0.01em;">
                    {{ p.name }}
                  </div>
                </div>

                <div class="flex-1 flex items-center justify-center relative">
                  <div
                    class="crown-pod-life leading-none text-center"
                    [class.life-pulse]="pulseId() === p.id"
                    [style.font-size]="lifeSize()">{{ p.life }}</div>
                  @if (deltaFor(p.id); as d) {
                    <div class="life-delta"
                         [class.life-delta--down]="d < 0"
                         [class.life-delta--up]="d > 0">{{ d > 0 ? '+' : '' }}{{ d }}</div>
                  }
                </div>

                <div class="flex gap-2 text-[10px] flex-wrap justify-center items-center min-h-[14px]"
                     style="color: var(--text-lo); font-family: var(--font-hud);">
                  @if (p.counters.poison) {
                    <span class="inline-flex items-center gap-0.5"><crown-icon name="Skull" [size]="10"></crown-icon>{{ p.counters.poison }}</span>
                  }
                  @if (p.counters.energy) {
                    <span class="inline-flex items-center gap-0.5"><crown-icon name="Zap" [size]="10"></crown-icon>{{ p.counters.energy }}</span>
                  }
                  @if (p.counters.experience) {
                    <span class="inline-flex items-center gap-0.5"><crown-icon name="Star" [size]="10"></crown-icon>{{ p.counters.experience }}</span>
                  }
                  @if (p.counters.storm) {
                    <span class="inline-flex items-center gap-0.5"><crown-icon name="CloudLightning" [size]="10"></crown-icon>{{ p.counters.storm }}</span>
                  }
                  @if (cmdDamageMax(p) > 0) {
                    <span class="inline-flex items-center gap-0.5"><crown-icon name="Swords" [size]="10"></crown-icon>{{ cmdDamageMax(p) }}</span>
                  }
                </div>
              </div>

              <!-- Counter drawer trigger (top right) -->
              <button
                class="absolute top-1.5 right-1.5 z-20 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer"
                style="background: rgba(255,255,255,0.06); color: var(--text-lo); border: 1px solid var(--divider);"
                (click)="openDrawer(p, $event)"
                aria-label="Open counters">
                <crown-icon name="Settings" [size]="14"></crown-icon>
              </button>
            </div>
          }
        </div>

        <!-- Bottom bar -->
        <div class="flex items-center gap-1 px-1.5 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex-shrink-0 relative z-10"
             style="border-top: 1px solid var(--divider); background: var(--bg-base);">
          <button class="crown-btn flex-[1] py-3 flex items-center justify-center" (click)="undo()" aria-label="Undo">
            <crown-icon name="Undo2" [size]="18"></crown-icon>
          </button>
          <button class="crown-btn flex-[1] py-3 flex items-center justify-center" (click)="askRestart()" aria-label="Reiniciar partida">
            <crown-icon name="RotateCw" [size]="18"></crown-icon>
          </button>
          <button class="crown-btn flex-[1] py-3 flex items-center justify-center" (click)="themePickerOpen.set(true)" aria-label="Theme">
            <crown-icon name="Sparkles" [size]="18"></crown-icon>
          </button>
          <button class="crown-btn flex-[1] py-3 flex items-center justify-center" (click)="guideOpen.set(true)" aria-label="Guía Magic">
            <crown-icon name="BookOpen" [size]="18"></crown-icon>
          </button>
          <button class="crown-btn flex-[1] py-3 flex items-center justify-center" (click)="exit()" aria-label="Exit">
            <crown-icon name="X" [size]="18"></crown-icon>
          </button>
        </div>

        @if (restartConfirm()) {
          <div class="fixed inset-0 z-[80] flex items-end md:items-center justify-center" (click)="restartConfirm.set(false)">
            <div class="restart-backdrop"></div>
            <div class="restart-modal" (click)="$event.stopPropagation()">
              <div class="restart-eyebrow">
                <crown-icon name="RotateCw" [size]="11"></crown-icon> Reiniciar partida
              </div>
              <div class="restart-title">¿Empezar de nuevo?</div>
              <div class="restart-sub">
                Vidas, contadores y commander damage vuelven a 0.
                Mismos jugadores, mismo formato. No se puede deshacer.
              </div>
              <div class="restart-actions">
                <button class="crown-btn flex-1 py-3 text-[11px] uppercase tracking-widest" (click)="restartConfirm.set(false)">Cancelar</button>
                <button class="crown-btn-primary flex-1 py-3 text-[11px] uppercase tracking-widest" (click)="confirmRestart()">Reiniciar</button>
              </div>
            </div>
          </div>
        }

        @if (drawerPlayer(); as p) {
          <app-counter-drawer
            [player]="p"
            (close)="drawerPid.set(null)"
            (change)="changeCounter(p.id, $event.counter, $event.delta)"
            (changeLife)="bumpDelta(p, $event)"
            (resetLife)="resetPlayerLife(p.id)"
            (openCmdDamage)="openCmdDamage(p.id)" />
        }

        @if (cmdMatrixPlayer(); as p) {
          <app-cmd-damage-matrix
            [target]="p"
            [allPlayers]="store.players()"
            (close)="cmdMatrixPid.set(null)"
            (change)="changeCmdDamage(p.id, $event.fromPid, $event.delta)" />
        }

        @if (themePickerOpen()) {
          <app-theme-picker (close)="themePickerOpen.set(false)" />
        }

        @if (guideOpen()) {
          <app-magic-guide (close)="guideOpen.set(false)" />
        }

        @if (store.isOver()) {
          <div class="mythic-moment">
            <div class="crown-backdrop"></div>
            <div class="mythic-moment-card">
              <div class="mythic-crown"><crown-icon name="Crown" [size]="64" [strokeWidth]="1.25"></crown-icon></div>
              <div class="mythic-eyebrow">Ganador de la mesa</div>
              <div class="mythic-name">{{ store.winner()?.name }}</div>
              <button class="mythic-cta" (click)="finish()">Guardar y salir</button>
            </div>
          </div>
        }

      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .life-pulse { animation: lifePulse 200ms cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes lifePulse { 0% { transform: scale(1); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }

    /* Floating life delta indicator */
    .life-delta {
      position: absolute;
      top: 50%;
      right: 8%;
      transform: translateY(-50%);
      font-family: var(--font-life, 'Space Grotesk'), sans-serif;
      font-weight: 700;
      font-size: clamp(20px, 4vmin, 38px);
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      pointer-events: none;
      animation: deltaFloat 1400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      text-shadow: 0 0 14px currentColor;
      opacity: 0;
    }
    .life-delta--up   { color: #62e08a; }
    .life-delta--down { color: #ff6b6b; }
    [data-theme='brutal'] .life-delta { font-weight: 900; text-shadow: none; }
    @keyframes deltaFloat {
      0%   { opacity: 0; transform: translateY(-30%) scale(0.7); }
      18%  { opacity: 1; transform: translateY(-50%) scale(1.05); }
      30%  { transform: translateY(-50%) scale(1); }
      80%  { opacity: 1; transform: translateY(-65%) scale(1); }
      100% { opacity: 0; transform: translateY(-90%) scale(0.95); }
    }

    /* Restart match modal */
    .restart-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .restart-modal {
      position: relative; z-index: 1;
      width: 100%; max-width: 26rem;
      padding: 22px;
      margin: 0 auto;
      background: var(--bg-elevated, #0c0c12);
      border: 1px solid var(--divider, rgba(255,255,255,0.1));
      border-radius: 18px 18px 0 0;
      color: var(--text-hi, #f5f5fa);
    }
    @media (min-width: 768px) { .restart-modal { border-radius: 18px; margin-bottom: 2rem; } }
    [data-theme='brutal'] .restart-modal { border-radius: 0; border-width: 2px; box-shadow: 6px 6px 0 0 var(--text-hi); }
    .restart-eyebrow {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--font-hud, 'JetBrains Mono'), monospace;
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo, #8a8a98);
    }
    .restart-title {
      font-family: var(--font-display, 'Space Grotesk'), sans-serif;
      font-weight: 600;
      font-size: 22px;
      letter-spacing: -0.02em;
      margin-top: 6px;
      color: var(--text-hi, #f5f5fa);
    }
    .restart-sub {
      font-size: 13px;
      color: var(--text-mid, #c4c4d0);
      margin-top: 8px;
      line-height: 1.45;
    }
    .restart-actions {
      display: flex; gap: 8px;
      margin-top: 18px;
    }
  `],
})
export class GamePage implements OnInit, OnDestroy {
  readonly store = inject(GameStore);
  private readonly groups = inject(GroupsStore);
  private readonly profile = inject(ProfileStore);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);

  readonly pulseId = signal<string | null>(null);
  readonly flashPid = signal<string | null>(null);
  readonly drawerPid = signal<string | null>(null);
  readonly cmdMatrixPid = signal<string | null>(null);
  readonly themePickerOpen = signal(false);
  readonly guideOpen = signal(false);
  readonly viewportTall = signal(true);
  readonly restartConfirm = signal(false);
  readonly deltaMap = signal<Record<string, number>>({});

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdFired = false;
  private pointerStart = 0;
  private currentPointerId: number | null = null;
  private lastBumpAt = 0;
  private deltaTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly DELTA_WINDOW_MS = 1400;

  constructor() {
    // Cuando el juego termina, cerrar todos los modals para que solo se vea Mythic Moment
    effect(() => {
      if (this.store.isOver()) {
        this.drawerPid.set(null);
        this.cmdMatrixPid.set(null);
        this.themePickerOpen.set(false);
      }
    });
  }

  readonly drawerPlayer = computed(() => {
    const id = this.drawerPid();
    return id ? this.store.players().find((p) => p.id === id) ?? null : null;
  });
  readonly cmdMatrixPlayer = computed(() => {
    const id = this.cmdMatrixPid();
    return id ? this.store.players().find((p) => p.id === id) ?? null : null;
  });

  readonly gridCols = computed(() => {
    const n = this.store.players().length;
    const tall = this.viewportTall();
    if (n === 2) return tall ? '1fr' : '1fr 1fr';
    if (n === 3) return tall ? '1fr' : '1fr 1fr 1fr';
    if (n === 4) return '1fr 1fr';
    if (n === 5 || n === 6) return tall ? '1fr 1fr' : '1fr 1fr 1fr';
    return '1fr';
  });

  readonly gridRows = computed(() => {
    const n = this.store.players().length;
    const tall = this.viewportTall();
    if (n === 2) return tall ? '1fr 1fr' : '1fr';
    if (n === 3) return tall ? '1fr 1fr 1fr' : '1fr';
    if (n === 4) return '1fr 1fr';
    if (n === 5) return tall ? '1fr 1fr 1fr' : '1fr 1fr';
    if (n === 6) return tall ? '1fr 1fr 1fr' : '1fr 1fr';
    return '1fr';
  });

  readonly lifeSize = computed((): string => {
    const n = this.store.players().length;
    if (n === 2) return 'clamp(96px, 18vmin, 260px)';
    if (n === 3) return 'clamp(80px, 14vmin, 200px)';
    if (n === 4) return 'clamp(64px, 12vmin, 160px)';
    if (n === 5) return 'clamp(52px, 9vmin, 120px)';
    if (n === 6) return 'clamp(48px, 9vmin, 110px)';
    return 'clamp(72px, 10vmin, 140px)';
  });

  async ngOnInit() {
    await this.store.restore();
    await this.groups.load();
    if (!this.store.game()) void this.router.navigate(['/']);
    this.updateOrientation();
  }

  ngOnDestroy() {
    this.endHold();
  }

  @HostListener('window:resize')
  updateOrientation() {
    this.viewportTall.set(window.innerHeight >= window.innerWidth);
  }

  pipFor(c: ManaColor) { return PIP[c]; }
  glowFor(c: ManaColor): string { return GLOW[c]; }
  romanFor(idx: number): string {
    return ['I','II','III','IV','V','VI'][idx] ?? String(idx + 1);
  }

  avatarFor(p: Player, idx: number): string {
    try {
      const raw = sessionStorage.getItem('crown.playerToFriend');
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string>;
        const friendId = map[p.id];
        if (friendId) {
          const friend = this.profile.friends().find((f) => f.id === friendId);
          if (friend?.avatar) return friend.avatar;
        }
      }
    } catch {}
    if (idx === 0) {
      const me = this.profile.me();
      if (me?.avatar) return me.avatar;
    }
    const fallback = ['User', 'Wand', 'Sword', 'Skull', 'Ghost', 'Cat'];
    return fallback[idx % fallback.length];
  }

  cmdDamageMax(p: Player): number {
    const vals = Object.values(p.commanderDamageFrom);
    return vals.length ? Math.max(...vals) : 0;
  }

  onPodPointerDown(p: Player, delta: number, ev: PointerEvent) {
    if (p.eliminated) return;
    ev.preventDefault();
    this.currentPointerId = ev.pointerId;
    this.pointerStart = Date.now();
    this.holdFired = false;
    this.endHold();
    this.holdTimer = setTimeout(() => {
      this.holdFired = true;
      void this.haptics.medium();
      this.drawerPid.set(p.id);
    }, 420);
  }

  onPodPointerUp(p: Player, delta: number, ev: PointerEvent) {
    if (this.currentPointerId !== ev.pointerId) { this.endHold(); return; }
    this.currentPointerId = null;
    this.endHold();
    if (this.holdFired) { this.holdFired = false; return; }
    if (p.eliminated) return;
    const duration = Date.now() - this.pointerStart;
    if (duration > 420) return;
    if (Date.now() - this.lastBumpAt < 60) return;
    this.lastBumpAt = Date.now();
    this.bumpDelta(p, delta);
    this.flashPid.set(p.id + ':' + (delta > 0 ? '+' : '-'));
    setTimeout(() => this.flashPid.set(null), 280);
  }

  onPodPointerCancel() {
    this.endHold();
    this.currentPointerId = null;
  }

  endHold() {
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
  }

  bumpDelta(p: Player, delta: number) {
    if (p.eliminated) return;
    this.store.life(p.id, delta);
    this.pulseId.set(p.id);
    setTimeout(() => this.pulseId.set(null), 220);
    this.accumDelta(p.id, delta);
    const mag = Math.abs(delta);
    if (mag >= 5) void this.haptics.medium();
    else void this.haptics.light();
    if (p.life + delta <= 0) void this.haptics.heavy();
  }

  deltaFor(pid: string): number | null {
    const v = this.deltaMap()[pid];
    return v && v !== 0 ? v : null;
  }

  private accumDelta(pid: string, delta: number) {
    const current = this.deltaMap()[pid] ?? 0;
    const next = current + delta;
    this.deltaMap.set({ ...this.deltaMap(), [pid]: next });
    const existing = this.deltaTimers.get(pid);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      const map = { ...this.deltaMap() };
      delete map[pid];
      this.deltaMap.set(map);
      this.deltaTimers.delete(pid);
    }, this.DELTA_WINDOW_MS);
    this.deltaTimers.set(pid, t);
  }

  resetPlayerLife(pid: string) {
    const g = this.store.game();
    if (!g) return;
    void this.haptics.medium();
    this.store.setLife(pid, g.startingLife);
    // Clear any in-flight delta indicator for this player
    const map = { ...this.deltaMap() };
    delete map[pid];
    this.deltaMap.set(map);
    const t = this.deltaTimers.get(pid);
    if (t) { clearTimeout(t); this.deltaTimers.delete(pid); }
    this.pulseId.set(pid);
    setTimeout(() => this.pulseId.set(null), 220);
  }

  askRestart() {
    if (this.store.isOver()) return;
    void this.haptics.warning();
    this.restartConfirm.set(true);
  }

  confirmRestart() {
    void this.haptics.heavy();
    this.store.restartMatch();
    this.deltaMap.set({});
    for (const t of this.deltaTimers.values()) clearTimeout(t);
    this.deltaTimers.clear();
    this.restartConfirm.set(false);
  }

  openDrawer(p: Player, ev: Event) {
    ev.stopPropagation();
    if (this.store.isOver()) return;
    void this.haptics.medium();
    this.drawerPid.set(p.id);
  }

  changeCounter(pid: string, counter: CounterType, delta: number) {
    void this.haptics.light();
    this.store.counter(pid, counter, delta);
  }

  openCmdDamage(pid: string) {
    void this.haptics.medium();
    this.drawerPid.set(null);
    this.cmdMatrixPid.set(pid);
  }

  changeCmdDamage(toPid: string, fromPid: string, delta: number) {
    void this.haptics.medium();
    this.store.cmdDamage(fromPid, toPid, delta);
  }

  undo() { void this.haptics.light(); this.store.undo(); }

  async finish() {
    const snap = this.store.game();
    const mode = sessionStorage.getItem('crown.gameMode') ?? 'real';
    if (snap?.endedAt && mode === 'real') {
      await this.groups.registerGameResult(snap);
      try {
        const raw = sessionStorage.getItem('crown.playerToFriend');
        if (raw) {
          const map = JSON.parse(raw) as Record<string, string>;
          const friendIds = Object.values(map);
          if (friendIds.length > 0) {
            await this.profile.load();
            const winnerFid = snap.winnerId ? map[snap.winnerId] : undefined;
            await this.profile.recordGameRemote(winnerFid, friendIds);
          }
        }
      } catch {}
    }
    sessionStorage.removeItem('crown.playerToFriend');
    sessionStorage.removeItem('crown.gameMode');
    this.groups.clearActiveSession();
    await this.store.end();
    void this.router.navigate(['/']);
  }

  async exit() { void this.router.navigate(['/']); }
}

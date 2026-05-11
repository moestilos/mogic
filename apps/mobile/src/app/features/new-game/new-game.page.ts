import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { GameFormat, ManaColor } from '@crown/game-engine';
import { GameStore } from '../../core/stores/game.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

interface SlotPlayer {
  name: string;
  color: ManaColor;
  friendId?: string;
}

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-6 md:px-12 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-2xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-7 relative z-10">
          <button class="crown-btn-ghost text-sm mb-3 flex items-center gap-1" (click)="back()">
            <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Atrás
          </button>
          <h1 class="crown-display text-4xl">Nueva partida</h1>
        </header>

        <section class="mb-6 relative z-10">
          <div class="crown-hud mb-3">Jugadores</div>
          <div class="flex gap-2">
            @for (n of counts; track n) {
              <button
                class="flex-1 py-4"
                [class]="count() === n ? 'crown-btn-primary' : 'crown-btn'"
                (click)="setCount(n)">{{ n }}</button>
            }
          </div>
        </section>

        <section class="mb-6 relative z-10">
          <div class="crown-hud mb-3">Formato</div>
          <div class="grid grid-cols-2 gap-2">
            @for (f of formats; track f.id) {
              <button
                class="py-4 px-4 text-left"
                [class]="format() === f.id ? 'crown-btn-primary' : 'crown-btn'"
                (click)="format.set(f.id)">
                <div class="text-base" style="font-family: var(--font-name); font-weight: 600;">{{ f.label }}</div>
                <div class="text-[10px] mt-0.5 opacity-70" style="font-family: var(--font-hud); letter-spacing: 0.18em;">{{ f.life }} LIFE</div>
              </button>
            }
          </div>
        </section>

        <section class="mb-7 flex-1 relative z-10">
          <div class="flex items-center justify-between mb-3">
            <div class="crown-hud">Roster</div>
            @if (profile.friends().length > 0) {
              <button class="crown-btn-ghost text-xs uppercase tracking-widest flex items-center gap-1"
                      (click)="loadFromFriends()">
                <crown-icon name="Users" [size]="12"></crown-icon> desde amigos
              </button>
            }
          </div>
          <div class="flex flex-col gap-2">
            @for (p of players(); track $index; let i = $index) {
              <div class="crown-card flex items-center gap-3 p-3">
                <button class="crown-color-swatch is-on" [ngClass]="p.color | lowercase" style="width:28px;height:28px;" (click)="cycleColor(i)"></button>
                <input
                  class="flex-1 bg-transparent outline-none crown-text-hi text-base"
                  style="font-family: var(--font-name); font-weight: 500;"
                  [value]="p.name"
                  (input)="rename(i, $any($event.target).value)"
                  placeholder="Nombre"
                  maxlength="20" />
                @if (p.friendId) {
                  <crown-icon name="Star" [size]="14" cls="crown-text-accent"></crown-icon>
                }
                @if (profile.friends().length > 0) {
                  <button class="crown-btn-ghost px-2" (click)="openFriendPickerFor(i)" aria-label="Asignar amigo">
                    <crown-icon name="Search" [size]="16"></crown-icon>
                  </button>
                }
              </div>
            }
          </div>
        </section>

        <button
          class="crown-btn-primary w-full py-5 text-base uppercase tracking-widest relative z-10"
          (click)="start()">Empezar partida</button>

        <!-- Friend picker modal -->
        @if (friendPickerOpen() !== null) {
          <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center" (click)="friendPickerOpen.set(null)">
            <div class="crown-backdrop"></div>
            <div class="crown-modal relative w-full max-w-md p-5 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
                 (click)="$event.stopPropagation()">
              <div class="crown-hud mb-3">Elige amigo</div>
              <div class="space-y-2 max-h-[60vh] overflow-y-auto">
                @for (f of profile.friends(); track f.id) {
                  <button class="crown-card w-full flex items-center gap-3 p-3 text-left transition active:scale-[0.98]"
                          (click)="assignFriend(f)">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--bg-input);">
                      <crown-icon [name]="$any(f.avatar)" [size]="20" cls="crown-text-hi"></crown-icon>
                    </div>
                    <div class="crown-pip" [ngClass]="f.color | lowercase"></div>
                    <div class="flex-1 truncate" style="font-family: var(--font-name); font-weight: 600;">{{ f.name }}</div>
                    <div class="crown-text-lo text-xs" style="font-family: var(--font-hud);">{{ f.wins }}W</div>
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
})
export class NewGamePage implements OnInit {
  private readonly store = inject(GameStore);
  readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly counts = [2, 3, 4, 5, 6];
  readonly formats: { id: GameFormat; label: string; life: number }[] = [
    { id: 'commander', label: 'Commander', life: 40 },
    { id: 'standard', label: 'Standard', life: 20 },
    { id: 'brawl', label: 'Brawl', life: 25 },
    { id: 'oathbreaker', label: 'Oathbreaker', life: 20 },
  ];

  readonly count = signal(4);
  readonly format = signal<GameFormat>('commander');
  readonly players = signal<SlotPlayer[]>(this.buildPlayers(4));
  readonly friendPickerOpen = signal<number | null>(null);

  async ngOnInit() {
    await this.profile.load();
    const me = this.profile.me();
    if (me) {
      const arr = this.players();
      arr[0] = { name: me.name, color: me.color };
      this.players.set([...arr]);
    }
  }

  private buildPlayers(n: number): SlotPlayer[] {
    return Array.from({ length: n }, (_, i) => ({ name: `Player ${i + 1}`, color: COLORS[i % COLORS.length] }));
  }

  setCount(n: number) {
    void this.haptics.light();
    const existing = this.players();
    const next = this.buildPlayers(n);
    for (let i = 0; i < Math.min(existing.length, n); i++) next[i] = existing[i];
    this.count.set(n);
    this.players.set(next);
  }

  rename(i: number, name: string) {
    const arr = [...this.players()];
    arr[i] = { ...arr[i], name, friendId: undefined };
    this.players.set(arr);
  }

  cycleColor(i: number) {
    void this.haptics.light();
    const arr = [...this.players()];
    const idx = COLORS.indexOf(arr[i].color);
    arr[i] = { ...arr[i], color: COLORS[(idx + 1) % COLORS.length] };
    this.players.set(arr);
  }

  openFriendPickerFor(i: number) {
    void this.haptics.light();
    this.friendPickerOpen.set(i);
  }

  assignFriend(f: { id: string; name: string; color: ManaColor }) {
    const idx = this.friendPickerOpen();
    if (idx === null) return;
    void this.haptics.medium();
    const arr = [...this.players()];
    arr[idx] = { name: f.name, color: f.color, friendId: f.id };
    this.players.set(arr);
    this.friendPickerOpen.set(null);
  }

  loadFromFriends() {
    void this.haptics.medium();
    const friends = this.profile.friends().slice(0, this.count());
    const me = this.profile.me();
    const arr: SlotPlayer[] = [];
    if (me) arr.push({ name: me.name, color: me.color });
    for (const f of friends) {
      if (arr.length >= this.count()) break;
      arr.push({ name: f.name, color: f.color, friendId: f.id });
    }
    while (arr.length < this.count()) {
      arr.push({ name: `Player ${arr.length + 1}`, color: COLORS[arr.length % COLORS.length] });
    }
    this.players.set(arr);
  }

  back() { void this.router.navigate(['/']); }

  start() {
    void this.haptics.medium();
    const slots = this.players();
    this.store.start({
      format: this.format(),
      players: slots.map((s) => ({ name: s.name, color: s.color })),
    });
    // Remember friend mapping in storage so game-end can credit wins.
    const snap = this.store.game();
    if (snap) {
      const mapping: Record<string, string> = {};
      snap.players.forEach((p, i) => {
        const friendId = slots[i]?.friendId;
        if (friendId) mapping[p.id] = friendId;
      });
      sessionStorage.setItem('crown.playerToFriend', JSON.stringify(mapping));
    }
    void this.router.navigate(['/game']);
  }
}

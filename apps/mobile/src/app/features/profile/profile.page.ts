import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { ProfileStore } from '../../core/stores/profile.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { AVATAR_ICONS, type IconKey } from '../../shared/icons';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-6 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-3xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-6 relative z-10">
          <button class="crown-btn-ghost text-sm mb-2 flex items-center gap-1" (click)="back()">
            <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Inicio
          </button>
          <h1 class="crown-display text-4xl">Perfil</h1>
        </header>

        @if (store.me(); as me) {
          <div class="crown-card flex items-center gap-4 p-5 mb-8 relative z-10">
            <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background: var(--bg-input);">
              <crown-icon [name]="$any(me.avatar)" [size]="28" cls="crown-text-hi"></crown-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="crown-display text-2xl truncate">{{ me.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="crown-pip" [ngClass]="me.color | lowercase"></div>
                <span class="crown-text-lo text-xs uppercase tracking-widest" style="font-family: var(--font-hud);">{{ me.color }}</span>
              </div>
            </div>
            <button class="crown-btn-ghost text-sm flex items-center gap-1" (click)="signOut()">
              <crown-icon name="LogOut" [size]="14"></crown-icon> Salir
            </button>
          </div>

          <div class="flex gap-2 mb-5 relative z-10">
            <button class="flex-1 py-3 text-xs uppercase tracking-widest"
                    [class]="tab() === 'friends' ? 'crown-btn-primary' : 'crown-btn'"
                    (click)="tab.set('friends')">Amigos</button>
            <button class="flex-1 py-3 text-xs uppercase tracking-widest"
                    [class]="tab() === 'stats' ? 'crown-btn-primary' : 'crown-btn'"
                    (click)="tab.set('stats')">Stats</button>
          </div>

          @if (tab() === 'friends') {
            <div class="space-y-2 mb-6 relative z-10">
              @if (store.friends().length === 0) {
                <div class="crown-card text-center p-8">
                  <crown-icon name="Users" [size]="40" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
                  <p class="crown-text-lo mt-3 mb-1">Sin amigos todavía</p>
                  <p class="crown-text-lo text-xs">Añade los compañeros de mesa abajo</p>
                </div>
              }
              @for (f of store.friends(); track f.id) {
                <div class="crown-card flex items-center gap-3 p-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--bg-input);">
                    <crown-icon [name]="$any(f.avatar)" [size]="20" cls="crown-text-hi"></crown-icon>
                  </div>
                  <div class="crown-pip" [ngClass]="f.color | lowercase"></div>
                  <div class="flex-1 min-w-0">
                    <div class="truncate" style="font-family: var(--font-name); font-weight: 600;">{{ f.name }}</div>
                    <div class="crown-text-lo text-xs flex gap-3 mt-0.5" style="font-family: var(--font-hud);">
                      <span><span class="crown-text-hi">{{ f.wins }}</span>W</span>
                      <span><span class="crown-text-hi">{{ f.games }}</span>G</span>
                      <span><span class="crown-text-hi">{{ winRate(f.wins, f.games) }}</span>%</span>
                    </div>
                  </div>
                  <button class="crown-btn-ghost px-2" (click)="remove(f.id)" aria-label="Eliminar amigo">
                    <crown-icon name="Trash2" [size]="16"></crown-icon>
                  </button>
                </div>
              }
            </div>

            <div class="crown-card p-4 relative z-10">
              <div class="crown-hud mb-3">Añadir amigo</div>
              <input class="crown-input mb-3"
                     style="font-family: var(--font-name);"
                     [value]="newName()"
                     (input)="newName.set($any($event.target).value)"
                     placeholder="Nombre"
                     maxlength="20" />
              <div class="flex gap-2 mb-3 flex-wrap">
                @for (c of colors; track c) {
                  <button class="crown-color-swatch"
                          [ngClass]="(c | lowercase)"
                          [class.is-on]="newColor() === c"
                          (click)="newColor.set(c)"
                          [attr.aria-label]="c"></button>
                }
              </div>
              <div class="grid grid-cols-6 gap-1.5 mb-4">
                @for (a of avatars; track a) {
                  <button class="aspect-square flex items-center justify-center"
                          [class]="newAvatar() === a ? 'crown-btn-primary' : 'crown-btn'"
                          (click)="newAvatar.set(a)">
                    <crown-icon [name]="a" [size]="18"></crown-icon>
                  </button>
                }
              </div>
              <button class="crown-btn-primary w-full py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      [disabled]="!canAdd()"
                      (click)="add()">
                <crown-icon name="UserPlus" [size]="14"></crown-icon> Añadir
              </button>
            </div>
          }

          @if (tab() === 'stats') {
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
              <div class="crown-card p-4">
                <div class="crown-hud mb-1">Amigos</div>
                <div class="text-3xl" style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: var(--life-letter); font-variant-numeric: tabular-nums;">{{ store.friends().length }}</div>
              </div>
              <div class="crown-card p-4">
                <div class="crown-hud mb-1">Partidas total</div>
                <div class="text-3xl" style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: var(--life-letter); font-variant-numeric: tabular-nums;">{{ totalGames() }}</div>
              </div>
              <div class="crown-card p-4">
                <div class="crown-hud mb-1">Wins amigos</div>
                <div class="text-3xl" style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: var(--life-letter); font-variant-numeric: tabular-nums;">{{ totalWins() }}</div>
              </div>
            </div>

            @if (topFriend(); as top) {
              <div class="crown-card mt-4 p-5 relative z-10"
                   [style.border-color]="'var(--accent-flat)'"
                   [style.box-shadow]="'var(--accent-glow)'">
                <div class="crown-hud crown-text-accent mb-2 flex items-center gap-2">
                  <crown-icon name="Trophy" [size]="14"></crown-icon> King of the table
                </div>
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background: var(--bg-input);">
                    <crown-icon [name]="$any(top.avatar)" [size]="28" cls="crown-text-accent"></crown-icon>
                  </div>
                  <div>
                    <div class="crown-display text-2xl">{{ top.name }}</div>
                    <div class="crown-text-lo text-xs" style="font-family: var(--font-hud);">{{ top.wins }} wins · {{ winRate(top.wins, top.games) }}% rate</div>
                  </div>
                </div>
              </div>
            }
          }
        }
      </div>
    </ion-content>
  `,
})
export class ProfilePage implements OnInit {
  readonly store = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'friends' | 'stats'>('friends');
  readonly colors = COLORS;
  readonly avatars = AVATAR_ICONS;
  readonly newName = signal('');
  readonly newColor = signal<ManaColor>('R');
  readonly newAvatar = signal<IconKey>('User');

  async ngOnInit() {
    await this.store.load();
    if (!this.store.me()) void this.router.navigate(['/sign-in']);
  }

  canAdd(): boolean { return this.newName().trim().length >= 1; }
  winRate(w: number, g: number): number { return g > 0 ? Math.round((w / g) * 100) : 0; }
  totalGames(): number { return this.store.friends().reduce((acc, f) => Math.max(acc, f.games), 0); }
  totalWins(): number { return this.store.friends().reduce((acc, f) => acc + f.wins, 0); }
  topFriend() {
    const friends = [...this.store.friends()].sort((a, b) => b.wins - a.wins);
    return friends[0]?.games ? friends[0] : null;
  }

  async add() {
    if (!this.canAdd()) return;
    void this.haptics.medium();
    await this.store.addFriend(this.newName(), this.newColor(), this.newAvatar());
    this.newName.set('');
  }

  async remove(id: string) { void this.haptics.warning(); await this.store.removeFriend(id); }
  async signOut() { void this.haptics.warning(); await this.store.signOut(); void this.router.navigate(['/sign-in']); }
  back() { void this.router.navigate(['/']); }
}

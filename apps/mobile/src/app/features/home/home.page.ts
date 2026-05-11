import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { GameStore } from '../../core/stores/game.store';
import { ThemeStore } from '../../core/stores/theme.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { ThemePickerComponent } from '../../shared/theme-picker.component';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, ThemePickerComponent, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen flex flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-10 flex items-start justify-between gap-3 relative z-10">
          <div class="min-w-0">
            <div class="crown-hud">MOGIC · V0.1</div>
            <div class="mt-3 crown-display text-5xl">Mogic<span class="crown-text-mid">.</span></div>
            @if (profile.me(); as me) {
              <p class="text-sm mt-2 crown-text-lo flex items-center gap-2">
                <crown-icon [name]="$any(me.avatar)" [size]="14" cls="crown-text-mid"></crown-icon>
                <span>Hola, <span class="crown-text-hi">{{ me.name }}</span></span>
              </p>
            } @else {
              <p class="text-sm mt-2 crown-text-lo">Magic. Premium. Mesa.</p>
            }
          </div>
          <div class="flex flex-col gap-2 items-end shrink-0">
            <button class="crown-btn w-12 h-12 flex items-center justify-center"
                    (click)="pickerOpen.set(true)"
                    [attr.aria-label]="'Tema actual: ' + currentThemeName()"
                    [title]="currentThemeName()">
              <crown-icon name="Sparkles" [size]="20"></crown-icon>
            </button>
            @if (profile.me(); as me) {
              <button class="crown-btn w-12 h-12 flex items-center justify-center"
                      (click)="openProfile()"
                      aria-label="Mi perfil">
                <crown-icon [name]="$any(me.avatar)" [size]="20"></crown-icon>
              </button>
            } @else {
              <button class="crown-btn w-12 h-12 flex items-center justify-center"
                      (click)="openProfile()"
                      aria-label="Perfil">
                <crown-icon name="Settings" [size]="20"></crown-icon>
              </button>
            }
          </div>
        </header>

        <main class="flex-1 flex flex-col gap-4 relative z-10">
          @if (game.game()) {
            <button class="crown-pod is-active text-left p-6 transition active:scale-[0.98]"
                    (click)="resume()">
              <div class="crown-hud">Continúa partida</div>
              <div class="crown-display text-2xl mt-2">{{ game.players().length }} jugadores</div>
              <div class="text-xs mt-1 crown-text-lo">Turno: {{ game.activePlayer()?.name }}</div>
            </button>
          }

          <button class="crown-pod text-left p-6 transition active:scale-[0.98]"
                  (click)="newGame()">
            <div class="crown-hud">Nueva</div>
            <div class="crown-display text-3xl mt-2">Quick Play</div>
            <div class="text-xs mt-1 crown-text-lo">Empieza en 3 taps</div>
          </button>

          <button class="crown-pod text-left p-6 transition active:scale-[0.98]"
                  (click)="openGroups()">
            <div class="crown-hud">Liga personal</div>
            <div class="crown-display text-2xl mt-2">Grupos & Standings</div>
            <div class="text-xs mt-1 crown-text-lo">Tracking wins · podios · rachas</div>
          </button>

          <button class="crown-pod text-left p-6 transition active:scale-[0.98]"
                  (click)="openProfile()">
            <div class="crown-hud">Amigos</div>
            <div class="crown-display text-2xl mt-2">
              @if (profile.friends().length > 0) {
                {{ profile.friends().length }} <span class="crown-text-lo text-base">jugadores</span>
              } @else {
                Añade amigos
              }
            </div>
            <div class="text-xs mt-1 crown-text-lo">Tracking wins automático</div>
          </button>
        </main>

        <footer class="text-center text-[10px] mt-8 relative z-10 uppercase tracking-widest crown-text-lo"
                style="font-family: var(--font-hud);">v0.1 — alpha</footer>
      </div>

      @if (pickerOpen()) {
        <app-theme-picker (close)="pickerOpen.set(false)" />
      }
    </ion-content>
  `,
})
export class HomePage implements OnInit {
  readonly game = inject(GameStore);
  readonly theme = inject(ThemeStore);
  readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  readonly pickerOpen = signal(false);

  async ngOnInit() {
    await this.game.restore();
    await this.profile.load();
  }

  currentThemeName(): string {
    return this.theme.themes.find((t) => t.id === this.theme.current())?.name ?? '';
  }

  newGame() { void this.router.navigate(['/new-game']); }
  resume() { void this.router.navigate(['/game']); }
  openGroups() { void this.router.navigate(['/groups']); }
  openProfile() { void this.router.navigate(['/profile']); }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { NgClass } from '@angular/common';
import { GameStore } from '../../core/stores/game.store';
import { GroupsStore } from '../../core/stores/groups.store';
import { ThemeStore } from '../../core/stores/theme.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { AuthStore } from '../../core/stores/auth.store';
import { InstallPromptService } from '../../shared/install-prompt.service';
import { ThemePickerComponent } from '../../shared/theme-picker.component';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, NgClass, ThemePickerComponent, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 lg:px-20 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-6xl mx-auto relative"
           style="background: var(--bg-base);">

        <app-animated-background></app-animated-background>

        <!-- ── Hero ─────────────────────────────────────────── -->
        <header class="relative z-10 flex items-start justify-between gap-3 mb-6">
          <div class="min-w-0">
            <div class="crown-hud">MOGIC · V0.1</div>
            <h1 class="crown-display mt-2"
                style="font-size: clamp(38px, 9vw, 64px); line-height: 1; letter-spacing: -0.04em;">
              Mogic<span class="crown-text-mid">.</span>
            </h1>
            @if (profile.me(); as me) {
              <div class="mt-3 flex items-center gap-2 crown-text-lo text-sm">
                <crown-icon [name]="$any(me.avatar)" [size]="14" cls="crown-text-mid"></crown-icon>
                <span>Hola, <span class="crown-text-hi">{{ me.name }}</span></span>
              </div>
            }
          </div>
          <div class="flex flex-col gap-2 items-end shrink-0">
            <button class="home-icon-btn"
                    (click)="pickerOpen.set(true)"
                    [attr.aria-label]="'Tema: ' + currentThemeName()"
                    [title]="currentThemeName()">
              <crown-icon name="Sparkles" [size]="18"></crown-icon>
            </button>
            <button class="home-icon-btn"
                    (click)="openProfile()"
                    aria-label="Perfil">
              <crown-icon [name]="$any(profile.me()?.avatar ?? 'Settings')" [size]="18"></crown-icon>
            </button>
            @if (auth.isAdmin()) {
              <button class="home-icon-btn"
                      style="border-color: var(--accent-flat); box-shadow: var(--accent-glow);"
                      (click)="openAdmin()"
                      aria-label="Admin">
                <crown-icon name="Shield" [size]="18" cls="crown-text-accent"></crown-icon>
              </button>
            }
          </div>
        </header>

        <!-- ── Install PWA banner ─────────────────────────── -->
        @if (install.canInstall() && !install.isStandalone()) {
          <button class="install-banner relative z-10 w-full mb-4 text-left" (click)="doInstall()">
            <crown-icon name="Sparkles" [size]="18" cls="crown-text-accent"></crown-icon>
            <div class="flex-1 min-w-0">
              <div class="install-title">Instalar Mogic</div>
              <div class="install-sub">Acceso directo desde tu home</div>
            </div>
            <crown-icon name="ChevronLeft" [size]="14" cls="crown-text-mid" style="transform: rotate(180deg);"></crown-icon>
          </button>
        }
        @if (install.isIOS() && !install.isStandalone() && !iosHintDismissed()) {
          <div class="install-banner ios-hint relative z-10 w-full mb-4">
            <crown-icon name="Sparkles" [size]="18" cls="crown-text-accent"></crown-icon>
            <div class="flex-1 min-w-0">
              <div class="install-title">Añade Mogic a tu pantalla</div>
              <div class="install-sub">Pulsa Compartir <strong>↑</strong> y luego "Añadir a inicio"</div>
            </div>
            <button class="crown-btn-ghost px-2" (click)="dismissIosHint()" aria-label="Cerrar">
              <crown-icon name="X" [size]="14"></crown-icon>
            </button>
          </div>
        }

        <!-- ── Stats row ────────────────────────────────────── -->
        <section class="grid grid-cols-3 gap-2 mb-5 relative z-10">
          <div class="home-stat">
            <crown-icon name="Trophy" [size]="14" cls="crown-text-accent"></crown-icon>
            <div class="home-stat-num">{{ totalWins() }}</div>
            <div class="home-stat-label">Wins</div>
          </div>
          <div class="home-stat">
            <crown-icon name="Dices" [size]="14" cls="crown-text-mid"></crown-icon>
            <div class="home-stat-num">{{ totalGames() }}</div>
            <div class="home-stat-label">Partidas</div>
          </div>
          <div class="home-stat">
            <crown-icon name="Users" [size]="14" cls="crown-text-mid"></crown-icon>
            <div class="home-stat-num">{{ profile.friends().length }}</div>
            <div class="home-stat-label">Amigos</div>
          </div>
        </section>

        <!-- ── Continue ─────────────────────────────────────── -->
        @if (game.game()) {
          <button class="home-resume crown-pod is-active relative z-10 w-full mb-5 text-left p-5 transition active:scale-[0.98]"
                  (click)="resume()">
            <div class="flex items-center gap-3">
              <div class="home-resume-icon">
                <crown-icon name="Dice5" [size]="28" cls="crown-text-accent"></crown-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="crown-hud crown-text-accent">Continúa partida</div>
                <div class="crown-display text-2xl mt-1">{{ game.players().length }} jugadores</div>
                <div class="crown-text-lo text-xs mt-1 flex items-center gap-1.5">
                  <crown-icon name="ChevronLeft" [size]="11" cls="crown-text-lo"></crown-icon>
                  Turno: <span class="crown-text-mid">{{ game.activePlayer()?.name }}</span>
                </div>
              </div>
              <div class="crown-text-accent">
                <crown-icon name="ChevronLeft" [size]="22" cls="crown-text-accent" style="transform: rotate(180deg);"></crown-icon>
              </div>
            </div>
          </button>
        }

        <!-- ── Hero CTA Quick Play ──────────────────────────── -->
        <button class="home-cta crown-pod relative z-10 w-full mb-4 text-left transition active:scale-[0.98]"
                (click)="newGame()">
          <div class="home-cta-art">
            <crown-icon name="Swords" [size]="56" [strokeWidth]="1.25" cls="home-cta-icon"></crown-icon>
          </div>
          <div class="home-cta-body">
            <div class="crown-hud">Empezar mesa</div>
            <div class="home-cta-title">Nueva partida</div>
            <div class="home-cta-sub">2-6 jugadores</div>
          </div>
          <div class="home-cta-arrow">
            <crown-icon name="ChevronLeft" [size]="20" style="transform: rotate(180deg);"></crown-icon>
          </div>
        </button>

        <!-- ── Secondary grid ───────────────────────────────── -->
        <section class="grid grid-cols-2 gap-3 relative z-10">
          <button class="home-tile crown-pod text-left transition active:scale-[0.98]"
                  (click)="openGroups()">
            <div class="home-tile-icon">
              <crown-icon name="Trophy" [size]="28" cls="crown-text-mid"></crown-icon>
            </div>
            <div class="crown-hud mt-3">Liga personal</div>
            <div class="home-tile-title">
              @if (groupsCount() > 0) {
                {{ groupsCount() }} <span class="crown-text-lo text-base">grupos</span>
              } @else { Grupos }
            </div>
            <div class="home-tile-sub">Standings · streaks</div>
          </button>

          <button class="home-tile crown-pod text-left transition active:scale-[0.98]"
                  (click)="openProfile()">
            <div class="home-tile-icon">
              <crown-icon name="Users" [size]="28" cls="crown-text-mid"></crown-icon>
            </div>
            <div class="crown-hud mt-3">Amigos</div>
            <div class="home-tile-title">
              @if (profile.friends().length > 0) {
                {{ profile.friends().length }} <span class="crown-text-lo text-base">jugadores</span>
              } @else { Añadir }
            </div>
            <div class="home-tile-sub">Win tracking auto</div>
          </button>

          <button class="home-tile crown-pod text-left transition opacity-60"
                  disabled>
            <div class="home-tile-icon">
              <crown-icon name="Scroll" [size]="28" cls="crown-text-lo"></crown-icon>
            </div>
            <div class="crown-hud mt-3">Historia</div>
            <div class="home-tile-title">Partidas</div>
            <div class="home-tile-sub">Pronto</div>
          </button>
        </section>

        <!-- ── Theme strip ──────────────────────────────────── -->
        <section class="mt-6 relative z-10">
          <div class="crown-hud mb-2 flex items-center gap-1.5">
            <crown-icon name="Sparkles" [size]="11"></crown-icon> Estética actual
          </div>
          <button class="home-theme-row w-full flex items-center gap-3 px-4 py-3 active:scale-[0.98] transition"
                  (click)="pickerOpen.set(true)">
            <div class="home-theme-swatch" [ngClass]="theme.current()"></div>
            <div class="flex-1 min-w-0 text-left">
              <div class="crown-text-hi" style="font-family: var(--font-name); font-weight: 600;">{{ currentThemeName() }}</div>
              <div class="crown-text-lo text-xs">{{ currentThemeTag() }}</div>
            </div>
            <div class="crown-text-lo">
              <crown-icon name="ChevronLeft" [size]="16" style="transform: rotate(180deg);"></crown-icon>
            </div>
          </button>
        </section>

        <footer class="text-center mt-8 relative z-10 crown-hud">v0.1 — alpha</footer>
      </div>

      @if (pickerOpen()) {
        <app-theme-picker (close)="pickerOpen.set(false)" />
      }
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    /* Header icon buttons */
    .home-icon-btn {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--divider);
      border-radius: 12px;
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease, transform 120ms ease;
    }
    .home-icon-btn:hover { background: rgba(255,255,255,0.08); }
    .home-icon-btn:active { transform: scale(0.94); }
    [data-theme='brutal'] .home-icon-btn { border-radius: 0; border-width: 1.5px; }
    [data-theme='stark']  .home-icon-btn { background: rgba(20,20,14,0.04); }

    /* Stats row */
    .home-stat {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .home-stat { background: rgba(20,20,14,0.03); }
    .home-stat-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 28px;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi);
      line-height: 1;
      margin-top: 4px;
    }
    .home-stat-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
    }

    /* Resume continue card */
    .home-resume {
      padding: 18px !important;
    }
    .home-resume-icon {
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(179,157,255,0.08);
      border-radius: 14px;
      flex-shrink: 0;
    }
    [data-theme='brutal'] .home-resume-icon { border-radius: 0; }

    /* Primary CTA Quick Play */
    .home-cta {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      cursor: pointer;
    }
    .home-cta-art {
      width: 88px; height: 88px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(179,157,255,0.12), rgba(157,210,255,0.08));
      border: 1px solid var(--divider);
      border-radius: 18px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    [data-theme='chrome'] .home-cta-art {
      background: linear-gradient(135deg, rgba(255,158,208,0.15), rgba(179,157,255,0.12), rgba(157,210,255,0.1));
    }
    [data-theme='sigil']  .home-cta-art { background: rgba(201,162,86,0.08); border-color: rgba(201,162,86,0.3); }
    [data-theme='brutal'] .home-cta-art { border-radius: 0; border-width: 1.5px; background: rgba(255,255,255,0.04); }
    [data-theme='stark']  .home-cta-art { background: rgba(20,20,14,0.03); }
    .home-cta-icon { color: var(--text-hi); opacity: 0.9; }
    [data-theme='chrome'] .home-cta-icon { color: var(--accent-flat); }
    [data-theme='sigil']  .home-cta-icon { color: var(--accent-flat); }

    .home-cta-body { flex: 1; min-width: 0; }
    .home-cta-title {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: clamp(28px, 6vw, 36px);
      letter-spacing: -0.03em;
      color: var(--text-hi);
      margin-top: 6px;
      line-height: 1;
    }
    .home-cta-sub {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 6px;
    }
    .home-cta-arrow {
      color: var(--text-mid);
      flex-shrink: 0;
    }

    /* Secondary tiles */
    .home-tile {
      padding: 16px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }
    .home-tile:disabled { cursor: not-allowed; }
    .home-tile-icon {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--divider);
      border-radius: 12px;
    }
    [data-theme='brutal'] .home-tile-icon { border-radius: 0; }
    [data-theme='stark']  .home-tile-icon { background: rgba(20,20,14,0.04); }
    .home-tile-title {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: 22px;
      letter-spacing: -0.02em;
      color: var(--text-hi);
      margin-top: 6px;
      line-height: 1.1;
    }
    .home-tile-sub {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 6px;
    }

    /* Theme strip */
    .home-theme-row {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
      cursor: pointer;
    }
    [data-theme='stark'] .home-theme-row { background: rgba(20,20,14,0.03); }
    .home-theme-swatch {
      width: 40px; height: 40px;
      border-radius: 10px;
      flex-shrink: 0;
      position: relative;
    }
    [data-theme='brutal'] .home-theme-swatch { border-radius: 0; }
    .home-theme-swatch.chrome {
      background: linear-gradient(115deg, #ff9ed0, #b39dff, #9dd2ff, #9dffb3, #ffe89d);
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    .home-theme-swatch.editorial { background: #f0f0f2; }
    .home-theme-swatch.vapor { background: linear-gradient(135deg, rgba(180,140,220,0.6), rgba(120,180,230,0.5)), #0e0d12; }
    .home-theme-swatch.brutal { background: #fff; border: 2px solid #08080a; }
    .home-theme-swatch.sigil { background: #C9A256; }
    .home-theme-swatch.stark { background: #14140e; }
    .home-theme-swatch.cards { background: linear-gradient(180deg, #e8c576, #c9a256 60%, #8a6a2a); box-shadow: inset 0 0 0 1px #3a2818; }

    .install-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: rgba(179,157,255,0.06);
      border: 1px solid var(--accent-flat);
      border-radius: var(--pod-radius);
      cursor: pointer;
      transition: background 160ms ease;
    }
    .install-banner:hover { background: rgba(179,157,255,0.1); }
    .install-banner.ios-hint { cursor: default; }
    .install-title {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 14px;
      color: var(--text-hi);
    }
    .install-sub {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 3px;
    }
    .install-sub strong { color: var(--accent-flat); font-weight: 700; }
  `],
})
export class HomePage implements OnInit {
  readonly game = inject(GameStore);
  readonly theme = inject(ThemeStore);
  readonly profile = inject(ProfileStore);
  readonly auth = inject(AuthStore);
  readonly install = inject(InstallPromptService);
  readonly groupsStore = inject(GroupsStore);
  readonly iosHintDismissed = signal(localStorage.getItem('mogic.iosHintDismissed') === '1');
  private readonly router = inject(Router);

  readonly pickerOpen = signal(false);

  readonly totalWins = computed(() =>
    this.profile.friends().reduce((sum, f) => sum + f.wins, 0)
  );
  readonly totalGames = computed(() =>
    this.profile.friends().reduce((max, f) => Math.max(max, f.games), 0)
  );
  readonly groupsCount = computed(() => this.groupsStore.groups().length);

  async ngOnInit() {
    await this.game.restore();
    await this.profile.load();
    await this.groupsStore.load();
  }

  currentThemeName(): string {
    return this.theme.themes.find((t) => t.id === this.theme.current())?.name ?? '';
  }
  currentThemeTag(): string {
    return this.theme.themes.find((t) => t.id === this.theme.current())?.tagline ?? '';
  }

  newGame() { void this.router.navigate(['/new-game']); }
  resume() { void this.router.navigate(['/game']); }
  openGroups() { void this.router.navigate(['/groups']); }
  openProfile() { void this.router.navigate(['/profile']); }
  openAdmin() { void this.router.navigate(['/admin']); }
  async doInstall() { await this.install.install(); }
  dismissIosHint() {
    localStorage.setItem('mogic.iosHintDismissed', '1');
    this.iosHintDismissed.set(true);
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { AuthStore } from '../../core/stores/auth.store';
import { ProfileStore } from '../../core/stores/profile.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { AVATAR_ICONS, type IconKey } from '../../shared/icons';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];
type Mode = 'login' | 'register';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)] max-w-xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-4 relative z-10 text-center">
          <crown-icon name="Crown" [size]="48" [strokeWidth]="1.25" cls="crown-text-accent"></crown-icon>
          <h1 class="crown-display text-3xl mt-2 mb-0.5">Mogic</h1>
          <p class="crown-text-lo text-xs">
            {{ mode() === 'login' ? 'Inicia sesión para jugar' : 'Crea tu cuenta' }}
          </p>
        </header>

        <!-- Tab toggle login / register -->
        <div class="flex gap-2 mb-4 relative z-10">
          <button class="flex-1 py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-1"
                  [class]="mode() === 'login' ? 'crown-btn-primary' : 'crown-btn'"
                  (click)="mode.set('login')">
            <crown-icon name="LogIn" [size]="12"></crown-icon> Entrar
          </button>
          <button class="flex-1 py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-1"
                  [class]="mode() === 'register' ? 'crown-btn-primary' : 'crown-btn'"
                  (click)="mode.set('register')">
            <crown-icon name="UserPlus" [size]="12"></crown-icon> Crear cuenta
          </button>
        </div>

        <section class="mb-3 relative z-10">
          <label class="crown-hud block mb-1.5 flex items-center gap-1">
            <crown-icon name="Mail" [size]="10"></crown-icon> Email
          </label>
          <input class="crown-input"
                 type="email"
                 autocomplete="email"
                 inputmode="email"
                 [value]="email()"
                 (input)="email.set($any($event.target).value)"
                 placeholder="tu@email.com" />
        </section>

        <section class="mb-4 relative z-10">
          <label class="crown-hud block mb-1.5 flex items-center gap-1">
            <crown-icon name="Lock" [size]="10"></crown-icon> Contraseña
          </label>
          <input class="crown-input"
                 type="password"
                 [autocomplete]="mode() === 'register' ? 'new-password' : 'current-password'"
                 [value]="password()"
                 (input)="password.set($any($event.target).value)"
                 placeholder="Mínimo 6 caracteres" />
        </section>

        @if (mode() === 'register') {
          <section class="mb-3 relative z-10">
            <label class="crown-hud block mb-1.5 flex items-center gap-1">
              <crown-icon name="User" [size]="10"></crown-icon> Nombre de jugador
            </label>
            <input class="crown-input"
                   style="font-family: var(--font-display); font-weight: var(--life-weight);"
                   [value]="displayName()"
                   (input)="displayName.set($any($event.target).value)"
                   placeholder="Mateo"
                   maxlength="20"
                   autocapitalize="words" />
          </section>

          <section class="mb-3 relative z-10">
            <label class="crown-hud block mb-2">Color</label>
            <div class="flex flex-wrap gap-1.5">
              @for (c of colors; track c) {
                <button class="crown-color-swatch"
                        style="width:32px;height:32px;"
                        [ngClass]="(c | lowercase)"
                        [class.is-on]="color() === c"
                        [attr.aria-label]="c"
                        (click)="color.set(c)"></button>
              }
            </div>
          </section>

          <section class="mb-4 relative z-10 flex-1 min-h-0">
            <label class="crown-hud block mb-2">Avatar</label>
            <div class="grid grid-cols-6 gap-1.5 max-h-[30vh] overflow-y-auto pr-1">
              @for (a of avatars; track a) {
                <button class="aspect-square flex items-center justify-center"
                        [class]="avatar() === a ? 'crown-btn-primary' : 'crown-btn'"
                        (click)="avatar.set(a)">
                  <crown-icon [name]="a" [size]="18"></crown-icon>
                </button>
              }
            </div>
          </section>
        } @else {
          <div class="flex-1"></div>
        }

        @if (errorMsg()) {
          <div class="crown-card mb-3 p-3 relative z-10"
               style="border-color: var(--danger); background: var(--danger-bg);">
            <p class="crown-text-danger text-sm">{{ errorMsg() }}</p>
          </div>
        }

        <button class="crown-btn-primary w-full py-4 text-sm uppercase tracking-widest relative z-10 flex items-center justify-center gap-2"
                [disabled]="!canSubmit()"
                (click)="submit()">
          <crown-icon [name]="mode() === 'login' ? 'LogIn' : 'UserPlus'" [size]="14"></crown-icon>
          <span>{{ mode() === 'login' ? 'Entrar' : 'Crear cuenta' }}</span>
        </button>

        <p class="text-center text-[10px] crown-text-lo mt-3 relative z-10" style="font-family: var(--font-hud); letter-spacing: 0.18em;">
          Cuenta guardada localmente. Sync cloud próximamente.
        </p>
      </div>
    </ion-content>
  `,
})
export class SignInPage {
  readonly auth = inject(AuthStore);
  private readonly localProfile = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly colors = COLORS;
  readonly avatars = AVATAR_ICONS;
  readonly mode = signal<Mode>('login');

  readonly email = signal('');
  readonly password = signal('');
  readonly displayName = signal('');
  readonly color = signal<ManaColor>('U');
  readonly avatar = signal<IconKey>('Crown');
  readonly errorMsg = signal<string | null>(null);

  canSubmit(): boolean {
    if (!this.email().includes('@')) return false;
    if (this.password().length < 6) return false;
    if (this.mode() === 'register' && this.displayName().trim().length < 2) return false;
    return true;
  }

  async submit() {
    this.errorMsg.set(null);
    if (!this.canSubmit()) return;
    await this.auth.load();
    void this.haptics.medium();

    if (this.mode() === 'login') {
      const { error } = await this.auth.login(this.email(), this.password());
      if (error) { this.errorMsg.set(error); void this.haptics.error(); return; }
    } else {
      const { error } = await this.auth.register({
        email: this.email(),
        password: this.password(),
        displayName: this.displayName().trim(),
        color: this.color(),
        avatar: this.avatar(),
      });
      if (error) { this.errorMsg.set(error); void this.haptics.error(); return; }
    }

    // Mirror to ProfileStore + scope friends list to this account
    const me = this.auth.me();
    if (me) {
      await this.localProfile.signIn(me.displayName, me.color, me.avatar);
      await this.localProfile.setScope(me.id);
    }

    void this.haptics.success();
    void this.router.navigate(['/']);
  }
}

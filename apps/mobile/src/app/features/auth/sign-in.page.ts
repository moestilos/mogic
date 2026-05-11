import { Component, inject, signal } from '@angular/core';
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
  selector: 'app-sign-in',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)] max-w-xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-5 relative z-10 text-center">
          <crown-icon name="Crown" [size]="48" [strokeWidth]="1.25" cls="crown-text-accent"></crown-icon>
          <h1 class="crown-display text-3xl mt-2 mb-0.5">Mogic</h1>
          <p class="crown-text-lo text-xs">Crea tu cuenta para jugar</p>
        </header>

        <section class="mb-4 relative z-10">
          <label class="crown-hud block mb-1.5 flex items-center gap-1">
            <crown-icon name="User" [size]="10"></crown-icon> Nombre
          </label>
          <input class="crown-input"
                 style="font-family: var(--font-display); font-weight: var(--life-weight); padding: 10px 14px;"
                 [value]="name()"
                 (input)="name.set($any($event.target).value)"
                 placeholder="Mateo"
                 maxlength="20"
                 autocapitalize="words" />
        </section>

        <section class="mb-4 relative z-10">
          <label class="crown-hud block mb-2">Color</label>
          <div class="flex flex-wrap gap-1.5">
            @for (c of colors; track c) {
              <button class="crown-color-swatch"
                      style="width:32px;height:32px;"
                      [ngClass]="(c | lowercase)"
                      [class.is-on]="color() === c"
                      [attr.aria-label]="c"
                      (click)="pickColor(c)"></button>
            }
          </div>
        </section>

        <section class="mb-5 relative z-10 flex-1 min-h-0 overflow-hidden">
          <label class="crown-hud block mb-2">Avatar</label>
          <div class="grid grid-cols-6 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
            @for (a of avatars; track a) {
              <button class="aspect-square flex items-center justify-center"
                      [class]="avatar() === a ? 'crown-btn-primary' : 'crown-btn'"
                      (click)="pickAvatar(a)">
                <crown-icon [name]="a" [size]="18"></crown-icon>
              </button>
            }
          </div>
        </section>

        <button class="crown-btn-primary w-full py-4 text-sm uppercase tracking-widest relative z-10 flex items-center justify-center gap-2"
                [disabled]="!canCreate()"
                (click)="create()">
          <crown-icon name="UserPlus" [size]="14"></crown-icon>
          <span>Crear cuenta</span>
        </button>
      </div>
    </ion-content>
  `,
})
export class SignInPage {
  private readonly store = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly colors = COLORS;
  readonly avatars = AVATAR_ICONS;
  readonly name = signal('');
  readonly color = signal<ManaColor>('U');
  readonly avatar = signal<IconKey>('Crown');

  canCreate(): boolean { return this.name().trim().length >= 2; }

  pickColor(c: ManaColor) { void this.haptics.light(); this.color.set(c); }
  pickAvatar(a: IconKey) { void this.haptics.light(); this.avatar.set(a); }

  async create() {
    if (!this.canCreate()) return;
    void this.haptics.success();
    await this.store.signIn(this.name(), this.color(), this.avatar());
    void this.router.navigate(['/']);
  }
}

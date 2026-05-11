import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { GroupsStore } from '../../core/stores/groups.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { GROUP_ICONS, type IconKey } from '../../shared/icons';

@Component({
  selector: 'app-group-new',
  standalone: true,
  imports: [IonContent, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-6 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-2xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-8 relative z-10">
          <button class="crown-btn-ghost text-sm mb-2 flex items-center gap-1" (click)="back()">
            <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Atrás
          </button>
          <h1 class="crown-display text-4xl">Nuevo grupo</h1>
        </header>

        <section class="mb-6 relative z-10">
          <label class="crown-hud block mb-2">Nombre</label>
          <input
            class="crown-input text-lg"
            style="font-family: var(--font-display); font-weight: var(--life-weight);"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
            placeholder="Mesa de los viernes"
            maxlength="40" />
        </section>

        <section class="mb-8 relative z-10">
          <label class="crown-hud block mb-2">Icono</label>
          <div class="grid grid-cols-6 md:grid-cols-8 gap-2">
            @for (i of icons; track i) {
              <button class="aspect-square flex items-center justify-center"
                      [class]="icon() === i ? 'crown-btn-primary' : 'crown-btn'"
                      (click)="pick(i)">
                <crown-icon [name]="i" [size]="22"></crown-icon>
              </button>
            }
          </div>
        </section>

        <div class="flex-1"></div>

        <button
          class="crown-btn-primary w-full py-5 text-base uppercase tracking-widest relative z-10"
          [disabled]="!canCreate()"
          (click)="create()">Crear grupo</button>
      </div>
    </ion-content>
  `,
})
export class GroupNewPage {
  private readonly store = inject(GroupsStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly icons = GROUP_ICONS;
  readonly name = signal('');
  readonly icon = signal<IconKey>('Crown');

  canCreate(): boolean { return this.name().trim().length >= 2; }
  pick(i: IconKey) { void this.haptics.light(); this.icon.set(i); }
  back() { void this.router.navigate(['/groups']); }

  async create() {
    if (!this.canCreate()) return;
    void this.haptics.medium();
    const g = await this.store.createGroup(this.name().trim(), this.icon());
    void this.router.navigate(['/groups', g.id]);
  }
}

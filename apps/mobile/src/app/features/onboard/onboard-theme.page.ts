import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ThemeStore, type ThemeId } from '../../core/stores/theme.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-onboard-theme',
  standalone: true,
  imports: [IonContent, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)] max-w-3xl mx-auto flex flex-col relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-4 relative z-10 text-center">
          <crown-icon name="Crown" [size]="42" [strokeWidth]="1.25" cls="crown-text-accent"></crown-icon>
          <h1 class="crown-display text-3xl mt-2">Mogic</h1>
          <p class="crown-display text-base mt-0.5 crown-text-mid">Elige tu estética</p>
          <p class="text-xs mt-1 crown-text-lo">Pulsa para previsualizar</p>
        </header>

        <section class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 relative z-10 mb-4 overflow-y-auto min-h-0">
          @for (t of theme.themes; track t.id) {
            <button
              class="crown-card text-left p-4 relative overflow-hidden transition active:scale-[0.98]"
              [class.crown-pod]="theme.current() === t.id"
              [class.is-active]="theme.current() === t.id"
              (click)="preview(t.id)">
              <div class="flex items-center justify-between mb-2 relative z-10">
                <div class="crown-text-hi" style="font-family: var(--font-name); font-weight: 600; font-size: 16px;">{{ t.name }}</div>
                @if (theme.current() === t.id) {
                  <div class="crown-tag crown-text-accent">activo</div>
                }
              </div>
              <p class="text-xs mb-3 crown-text-lo relative z-10">{{ t.tagline }}</p>
              <div class="flex flex-wrap gap-1 relative z-10 mb-3">
                @for (tag of t.tags; track tag) {
                  <span class="crown-tag">{{ tag }}</span>
                }
              </div>
              <div class="rounded-lg h-10 relative overflow-hidden z-10"
                   [style.background]="previewBg(t.id)"
                   [style.border-radius]="'var(--btn-radius)'">
                <div class="absolute inset-y-0 left-0 w-1.5"
                     [style.background]="previewAccent(t.id)"></div>
              </div>
            </button>
          }
        </section>

        <button
          class="crown-btn-primary w-full py-4 text-sm uppercase tracking-widest relative z-10"
          (click)="confirm()">Continuar con {{ currentName() }}</button>

        <p class="text-center text-[10px] crown-text-lo mt-2 relative z-10" style="font-family: var(--font-hud); letter-spacing: 0.18em;">
          Podrás cambiarlo cuando quieras
        </p>
      </div>
    </ion-content>
  `,
})
export class OnboardThemePage {
  readonly theme = inject(ThemeStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  preview(id: ThemeId) {
    void this.haptics.light();
    void this.theme.preview(id);
  }

  currentName(): string {
    return this.theme.themes.find((t) => t.id === this.theme.current())?.name ?? '';
  }

  async confirm() {
    void this.haptics.success();
    await this.theme.set(this.theme.current());
    void this.router.navigate(['/sign-in']);
  }

  previewBg(id: ThemeId): string {
    switch (id) {
      case 'chrome': return 'linear-gradient(180deg, #0c0c12, #08080c)';
      case 'editorial': return '#0c0c0e';
      case 'vapor': return 'linear-gradient(135deg, rgba(180,140,220,0.25), rgba(120,180,230,0.18)), #0e0d12';
      case 'brutal': return '#08080a';
      case 'sigil': return '#0a0805';
      case 'stark': return '#fafaf6';
      case 'cards': return 'radial-gradient(140% 100% at 50% 0%, #efe5cc, #e6dab9 70%, #d4c393)';
    }
  }

  previewAccent(id: ThemeId): string {
    switch (id) {
      case 'chrome': return 'linear-gradient(180deg, #ff9ed0, #b39dff, #9dd2ff, #9dffb3, #ffe89d)';
      case 'editorial': return '#f0f0f2';
      case 'vapor': return 'rgba(255,255,255,0.6)';
      case 'brutal': return '#ffffff';
      case 'sigil': return '#C9A256';
      case 'stark': return '#14140e';
      case 'cards': return 'linear-gradient(180deg, #e8c576, #c9a256 60%, #8a6a2a)';
    }
  }
}

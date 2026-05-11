import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ThemeStore, type ThemeId } from '../core/stores/theme.store';
import { HapticsService } from '../core/services/haptics.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center" (click)="close.emit()">
      <div class="crown-backdrop"></div>

      <div class="crown-modal relative w-full max-w-2xl mx-auto p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] md:mb-8"
           style="border-radius: var(--modal-radius) var(--modal-radius) 0 0;"
           (click)="$event.stopPropagation()">

        <div class="flex items-center justify-between mb-5">
          <div>
            <div class="crown-hud">Aesthetic</div>
            <div class="crown-display text-2xl mt-1">Elige tu tema</div>
          </div>
          <button class="crown-btn-ghost px-3" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="22"></crown-icon>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          @for (t of store.themes; track t.id) {
            <button
              class="text-left rounded-2xl p-4 transition active:scale-[0.98] relative overflow-hidden"
              [style.background]="t.id === store.current() ? 'var(--bg-input)' : 'transparent'"
              [style.border]="'1px solid var(--divider)'"
              [style.border-radius]="'var(--pod-radius)'"
              [class.crown-pod]="t.id === store.current()"
              [class.is-active]="t.id === store.current()"
              (click)="pick(t.id)">
              <div class="flex items-center justify-between mb-2 relative z-10">
                <div class="crown-text-hi" style="font-family: var(--font-name); font-weight: 600; font-size: 15px;">{{ t.name }}</div>
                @if (t.id === store.current()) {
                  <div class="crown-tag crown-text-accent">activo</div>
                }
              </div>
              <p class="text-xs mb-3 crown-text-lo relative z-10">{{ t.tagline }}</p>
              <div class="flex flex-wrap gap-1 relative z-10">
                @for (tag of t.tags; track tag) {
                  <span class="crown-tag">{{ tag }}</span>
                }
              </div>

              <div class="mt-3 rounded-lg h-8 relative overflow-hidden z-10"
                   [style.background]="previewBg(t.id)"
                   [style.border-radius]="'var(--btn-radius)'">
                <div class="absolute inset-y-0 left-0 w-1.5"
                     [style.background]="previewAccent(t.id)"></div>
              </div>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class ThemePickerComponent {
  readonly store = inject(ThemeStore);
  private readonly haptics = inject(HapticsService);
  @Output() readonly close = new EventEmitter<void>();

  async pick(id: ThemeId) {
    void this.haptics.medium();
    await this.store.set(id);
  }

  previewBg(id: ThemeId): string {
    switch (id) {
      case 'chrome': return 'linear-gradient(180deg, #0c0c12, #08080c)';
      case 'editorial': return '#0c0c0e';
      case 'vapor': return 'linear-gradient(135deg, rgba(180,140,220,0.25), rgba(120,180,230,0.18)), #0e0d12';
      case 'brutal': return '#08080a';
      case 'sigil': return '#0a0805';
      case 'stark': return '#fafaf6';
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
    }
  }
}

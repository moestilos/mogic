import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ThemeStore, type ThemeId } from '../core/stores/theme.store';
import { HapticsService } from '../core/services/haptics.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center" (click)="close.emit()">
      <div class="theme-picker-backdrop"></div>

      <div class="theme-picker-modal relative w-full max-w-2xl mx-auto p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] md:mb-8 max-h-[88vh] overflow-y-auto"
           (click)="$event.stopPropagation()">

        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="theme-picker-eyebrow">Aesthetic · live preview</div>
            <div class="theme-picker-title">Elige tu tema</div>
          </div>
          <button class="theme-picker-close" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="20"></crown-icon>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (t of store.themes; track t.id) {
            <button class="theme-card text-left"
                    [class.is-on]="t.id === store.current()"
                    (click)="pick(t.id)">
              <div class="flex items-start justify-between mb-2">
                <div class="theme-card-name">{{ t.name }}</div>
                @if (t.id === store.current()) {
                  <div class="theme-card-check">
                    <crown-icon name="Check" [size]="12"></crown-icon>
                  </div>
                }
              </div>
              <p class="theme-card-tagline">{{ t.tagline }}</p>
              <div class="flex flex-wrap gap-1 mb-3">
                @for (tag of t.tags; track tag) {
                  <span class="theme-card-tag">{{ tag }}</span>
                }
              </div>

              <div class="theme-card-swatch" [style.background]="previewBg(t.id)">
                <div class="theme-card-stripe" [style.background]="previewAccent(t.id)"></div>
                <div class="theme-card-swatch-text"
                     [style.color]="t.id === 'stark' ? '#14140e' : '#e8e8f0'"
                     [style.font-family]="previewFont(t.id)">Aa 42</div>
              </div>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Backdrop fija, no toca el modal */
    .theme-picker-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    /* Modal alta opacidad propio bg dark para visibilidad en cualquier tema */
    .theme-picker-modal {
      position: relative;
      z-index: 1;
      background: #0c0c12;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 22px;
      color: #e8e8f0;
    }
    @media (max-width: 768px) {
      .theme-picker-modal { border-radius: 22px 22px 0 0; }
    }

    .theme-picker-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #7a7a90;
    }
    .theme-picker-title {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 500;
      font-size: 22px;
      letter-spacing: -0.02em;
      margin-top: 4px;
      color: #f5f5fa;
    }
    .theme-picker-close {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #c4c4d0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .theme-picker-close:hover { background: rgba(255,255,255,0.1); }

    .theme-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 14px;
      transition: transform 160ms ease, border-color 200ms ease, background 200ms ease;
      cursor: pointer;
    }
    .theme-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18); }
    .theme-card:active { transform: scale(0.98); }
    .theme-card.is-on {
      background: rgba(179,157,255,0.08);
      border-color: rgba(179,157,255,0.5);
      box-shadow: 0 0 24px rgba(179,157,255,0.25);
    }

    .theme-card-name {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 600;
      font-size: 16px;
      color: #f5f5fa;
    }
    .theme-card-check {
      width: 22px; height: 22px;
      border-radius: 99px;
      background: #b39dff;
      color: #0c0c12;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .theme-card-tagline {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      color: #9999a8;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    .theme-card-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #9999a8;
      padding: 3px 7px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    .theme-card-swatch {
      position: relative;
      height: 56px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      padding-left: 20px;
    }
    .theme-card-stripe {
      position: absolute;
      top: 0; bottom: 0; left: 0;
      width: 4px;
    }
    .theme-card-swatch-text {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class ThemePickerComponent {
  readonly store = inject(ThemeStore);
  private readonly haptics = inject(HapticsService);
  @Output() readonly close = new EventEmitter<void>();

  async pick(id: ThemeId) {
    void this.haptics.medium();
    await this.store.set(id);
    setTimeout(() => this.close.emit(), 220);
  }

  previewBg(id: ThemeId): string {
    switch (id) {
      case 'chrome': return 'linear-gradient(180deg, #0c0c12, #08080c)';
      case 'editorial': return '#0c0c0e';
      case 'vapor': return 'linear-gradient(135deg, rgba(180,140,220,0.4), rgba(120,180,230,0.3)), #0e0d12';
      case 'brutal': return '#08080a';
      case 'sigil': return '#0a0805';
      case 'stark': return '#fafaf6';
    }
  }

  previewAccent(id: ThemeId): string {
    switch (id) {
      case 'chrome': return 'linear-gradient(180deg, #ff9ed0, #b39dff, #9dd2ff, #9dffb3, #ffe89d)';
      case 'editorial': return '#f0f0f2';
      case 'vapor': return 'rgba(255,255,255,0.7)';
      case 'brutal': return '#ffffff';
      case 'sigil': return '#C9A256';
      case 'stark': return '#14140e';
    }
  }

  previewFont(id: ThemeId): string {
    switch (id) {
      case 'chrome': return "'Space Grotesk', sans-serif";
      case 'editorial': return "'Fraunces', serif";
      case 'vapor': return "'Inter', sans-serif";
      case 'brutal': return "'JetBrains Mono', monospace";
      case 'sigil': return "'Cormorant Garamond', serif";
      case 'stark': return "'Instrument Serif', serif";
    }
  }
}

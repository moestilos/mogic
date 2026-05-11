import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { CounterType, Player } from '@crown/game-engine';
import { IconComponent } from '../../shared/icon.component';
import type { IconKey } from '../../shared/icons';

interface CounterDef { key: CounterType; label: string; icon: IconKey; tint: string; }

const COUNTERS: CounterDef[] = [
  { key: 'poison',       label: 'Poison',      icon: 'Skull',          tint: 'crown-text-success' },
  { key: 'energy',       label: 'Energy',      icon: 'Zap',            tint: 'crown-text-accent' },
  { key: 'experience',   label: 'Experience',  icon: 'Star',           tint: 'crown-text-warn' },
  { key: 'storm',        label: 'Storm',       icon: 'CloudLightning', tint: 'crown-text-mid' },
  { key: 'commanderTax', label: 'Cmd Tax',     icon: 'PlusCircle',     tint: 'crown-text-mid' },
  { key: 'rad',          label: 'Rad',         icon: 'Radiation',      tint: 'crown-text-danger' },
];

@Component({
  selector: 'app-counter-drawer',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center" (click)="close.emit()">
      <div class="crown-backdrop"></div>
      <div class="crown-modal relative w-full max-w-2xl mx-auto p-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] md:mb-8 max-h-[92vh] overflow-y-auto"
           style="border-radius: var(--modal-radius) var(--modal-radius) 0 0;"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="crown-hud">Jugador</div>
            <div class="crown-display text-2xl mt-1">{{ player.name }}</div>
          </div>
          <button class="crown-btn-ghost px-3" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="22"></crown-icon>
          </button>
        </div>

        <div class="crown-card p-4 mb-3">
          <div class="flex items-center justify-between mb-3">
            <div class="crown-hud">Vida</div>
            <div class="text-4xl"
                 style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: var(--life-letter); font-variant-numeric: tabular-nums; color: var(--text-hi);">{{ player.life }}</div>
          </div>
          <div class="grid grid-cols-6 gap-1.5">
            <button class="crown-btn py-3 text-sm" (click)="changeLife.emit(-10)">−10</button>
            <button class="crown-btn py-3 text-sm" (click)="changeLife.emit(-5)">−5</button>
            <button class="crown-btn py-3 text-sm" (click)="changeLife.emit(-1)">−1</button>
            <button class="crown-btn-primary py-3 text-sm" (click)="changeLife.emit(+1)">+1</button>
            <button class="crown-btn py-3 text-sm" (click)="changeLife.emit(+5)">+5</button>
            <button class="crown-btn py-3 text-sm" (click)="changeLife.emit(+10)">+10</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          @for (c of counters; track c.key) {
            <div class="crown-card flex items-center gap-3 p-3">
              <div class="w-9 h-9 flex items-center justify-center" [class]="c.tint">
                <crown-icon [name]="c.icon" [size]="20"></crown-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs truncate" style="font-family: var(--font-name); font-weight: 500;">{{ c.label }}</div>
                <div class="text-2xl"
                     style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: var(--life-letter); font-variant-numeric: tabular-nums;">{{ value(c.key) }}</div>
              </div>
              <div class="flex gap-1.5">
                <button class="crown-btn w-9 h-9 flex items-center justify-center" (click)="change.emit({ counter: c.key, delta: -1 })">
                  <crown-icon name="Minus" [size]="16"></crown-icon>
                </button>
                <button class="crown-btn-primary w-9 h-9 flex items-center justify-center" (click)="change.emit({ counter: c.key, delta: +1 })">
                  <crown-icon name="Plus" [size]="16"></crown-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <button
          class="crown-btn-danger w-full py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          (click)="openCmdDamage.emit()">
          <crown-icon name="Swords" [size]="14"></crown-icon> Commander Damage
        </button>
      </div>
    </div>
  `,
})
export class CounterDrawerComponent {
  @Input({ required: true }) player!: Player;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly change = new EventEmitter<{ counter: CounterType; delta: number }>();
  @Output() readonly changeLife = new EventEmitter<number>();
  @Output() readonly openCmdDamage = new EventEmitter<void>();

  readonly counters = COUNTERS;
  value(c: CounterType): number { return this.player.counters[c] ?? 0; }
}

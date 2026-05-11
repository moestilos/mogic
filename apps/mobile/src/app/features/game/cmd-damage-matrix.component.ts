import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { Player } from '@crown/game-engine';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-cmd-damage-matrix',
  standalone: true,
  imports: [NgClass, LowerCasePipe, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="close.emit()">
      <div class="crown-backdrop"></div>
      <div class="crown-modal relative w-full max-w-3xl p-5 max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <div>
            <div class="crown-hud crown-text-danger flex items-center gap-2">
              <crown-icon name="Swords" [size]="12"></crown-icon> Commander Damage
            </div>
            <div class="crown-display text-xl mt-1">Recibido por {{ target.name }}</div>
          </div>
          <button class="crown-btn-ghost px-3" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="22"></crown-icon>
          </button>
        </div>

        <p class="crown-text-lo text-xs mb-4">21+ de un solo source = derrota. También resta vida.</p>

        <div class="space-y-2">
          @for (p of opponents(); track p.id) {
            <div class="crown-card flex items-center gap-3 p-3">
              <div class="crown-color-swatch is-on" [ngClass]="p.color | lowercase" style="width:28px;height:28px;"></div>
              <div class="flex-1">
                <div style="font-family: var(--font-name); font-weight: 500;">{{ p.name }}</div>
                <div class="crown-text-lo text-xs" style="font-family: var(--font-hud);">de su comandante</div>
              </div>
              <button class="crown-btn w-10 h-10 flex items-center justify-center" (click)="emit(p.id, -1)">
                <crown-icon name="Minus" [size]="16"></crown-icon>
              </button>
              <div class="w-12 text-center text-2xl"
                   style="font-family: var(--font-life); font-weight: var(--life-weight); font-variant-numeric: tabular-nums;"
                   [class.crown-text-danger]="dmg(p.id) >= 21"
                   [class.crown-text-warn]="dmg(p.id) >= 15 && dmg(p.id) < 21">{{ dmg(p.id) }}</div>
              <button class="crown-btn-danger w-10 h-10 flex items-center justify-center" (click)="emit(p.id, +1)">
                <crown-icon name="Plus" [size]="16"></crown-icon>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CmdDamageMatrixComponent {
  @Input({ required: true }) target!: Player;
  @Input({ required: true }) allPlayers: Player[] = [];
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly change = new EventEmitter<{ fromPid: string; delta: number }>();

  opponents(): Player[] { return this.allPlayers.filter((p) => p.id !== this.target.id); }
  dmg(fromPid: string): number { return this.target.commanderDamageFrom[fromPid] ?? 0; }
  emit(fromPid: string, delta: number) {
    if (delta < 0 && this.dmg(fromPid) === 0) return;
    this.change.emit({ fromPid, delta });
  }
}

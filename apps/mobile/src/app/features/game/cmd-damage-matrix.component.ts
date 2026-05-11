import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { Player } from '@crown/game-engine';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-cmd-damage-matrix',
  standalone: true,
  imports: [NgClass, LowerCasePipe, IconComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" (click)="close.emit()">
      <div class="cdm-backdrop"></div>
      <div class="cdm-modal" (click)="$event.stopPropagation()">
        <div class="cdm-header">
          <div>
            <div class="cdm-eyebrow">
              <crown-icon name="Swords" [size]="11"></crown-icon> Commander Damage
            </div>
            <div class="cdm-title">Recibido por {{ target.name }}</div>
          </div>
          <button class="cdm-icon-btn" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="18"></crown-icon>
          </button>
        </div>

        <p class="cdm-info">21+ de un solo comandante = derrota. También resta vida.</p>

        <div class="cdm-rows">
          @for (p of opponents(); track p.id) {
            <div class="cdm-row">
              <div class="cdm-swatch" [ngClass]="p.color | lowercase"></div>
              <div class="cdm-row-info">
                <div class="cdm-row-name">{{ p.name }}</div>
                <div class="cdm-row-sub">de su comandante</div>
              </div>
              <button class="cdm-icon-btn cdm-icon-btn-sm" (click)="emit(p.id, -1)">
                <crown-icon name="Minus" [size]="14"></crown-icon>
              </button>
              <div class="cdm-value"
                   [class.cdm-value--danger]="dmg(p.id) >= 21"
                   [class.cdm-value--warn]="dmg(p.id) >= 15 && dmg(p.id) < 21">{{ dmg(p.id) }}</div>
              <button class="cdm-icon-btn cdm-icon-btn-sm cdm-icon-btn-danger" (click)="emit(p.id, +1)">
                <crown-icon name="Plus" [size]="14"></crown-icon>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .cdm-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .cdm-modal {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 36rem;
      max-height: 90vh;
      overflow-y: auto;
      padding: 22px;
      background: #0c0c12;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 22px;
      color: #e8e8f0;
    }

    .cdm-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px;
    }
    .cdm-eyebrow {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #ff7a7a;
    }
    .cdm-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 20px;
      letter-spacing: -0.02em;
      margin-top: 5px;
      color: #f5f5fa;
    }
    .cdm-info {
      font-size: 12px;
      color: #9999a8;
      margin-bottom: 14px;
      line-height: 1.4;
    }

    .cdm-icon-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #c4c4d0;
      cursor: pointer;
      transition: background 160ms ease, transform 100ms ease;
    }
    .cdm-icon-btn:hover { background: rgba(255,255,255,0.1); }
    .cdm-icon-btn:active { transform: scale(0.92); }
    .cdm-icon-btn-sm { width: 34px; height: 34px; border-radius: 9px; }
    .cdm-icon-btn-danger {
      background: rgba(255,122,122,0.15);
      border-color: rgba(255,122,122,0.45);
      color: #ff9e9e;
    }
    .cdm-icon-btn-danger:hover { background: rgba(255,122,122,0.25); }

    .cdm-rows { display: flex; flex-direction: column; gap: 8px; }
    .cdm-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    .cdm-swatch {
      width: 28px; height: 28px;
      border-radius: 8px;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
    }
    .cdm-swatch.w { background: linear-gradient(135deg, #FFFDE0, #F8E9B4); }
    .cdm-swatch.u { background: linear-gradient(135deg, #B7DDF8, #4F8FCB); }
    .cdm-swatch.b { background: linear-gradient(135deg, #4d4253, #1a1620); }
    .cdm-swatch.r { background: linear-gradient(135deg, #F8B7B0, #D24F45); }
    .cdm-swatch.g { background: linear-gradient(135deg, #BFE6A6, #5A9A4C); }
    .cdm-swatch.c { background: linear-gradient(135deg, #d8d8e0, #8b8b9e); }

    .cdm-row-info { flex: 1; min-width: 0; }
    .cdm-row-name {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: #f5f5fa;
    }
    .cdm-row-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.06em;
      color: #7a7a90;
      margin-top: 2px;
    }
    .cdm-value {
      width: 44px;
      text-align: center;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 22px;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      color: #f5f5fa;
    }
    .cdm-value--warn { color: #ffd56a; }
    .cdm-value--danger { color: #ff7a7a; }
  `],
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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { CounterType, Player } from '@crown/game-engine';
import { IconComponent } from '../../shared/icon.component';
import type { IconKey } from '../../shared/icons';

interface CounterDef { key: CounterType; label: string; icon: IconKey; tint: string; }

const COUNTERS: CounterDef[] = [
  { key: 'poison',       label: 'Poison',      icon: 'Skull',          tint: '#9dffb3' },
  { key: 'energy',       label: 'Energy',      icon: 'Zap',            tint: '#b39dff' },
  { key: 'experience',   label: 'Experience',  icon: 'Star',           tint: '#ffe89d' },
  { key: 'storm',        label: 'Storm',       icon: 'CloudLightning', tint: '#c4c4d0' },
  { key: 'commanderTax', label: 'Cmd Tax',     icon: 'PlusCircle',     tint: '#c4c4d0' },
  { key: 'rad',          label: 'Rad',         icon: 'Radiation',      tint: '#ff7a7a' },
];

@Component({
  selector: 'app-counter-drawer',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center" (click)="close.emit()">
      <div class="cd-backdrop"></div>
      <div class="cd-modal" (click)="$event.stopPropagation()">

        <div class="cd-header">
          <div>
            <div class="cd-eyebrow">Jugador</div>
            <div class="cd-name">{{ player.name }}</div>
          </div>
          <button class="cd-icon-btn" (click)="close.emit()" aria-label="Cerrar">
            <crown-icon name="X" [size]="18"></crown-icon>
          </button>
        </div>

        <!-- LIFE -->
        <div class="cd-section">
          <div class="cd-section-head">
            <div class="cd-eyebrow">Vida</div>
            <div class="cd-life-num">{{ player.life }}</div>
          </div>
          <div class="cd-life-grid">
            <button class="cd-btn cd-btn-neg" (click)="changeLife.emit(-10)">−10</button>
            <button class="cd-btn cd-btn-neg" (click)="changeLife.emit(-5)">−5</button>
            <button class="cd-btn cd-btn-neg" (click)="changeLife.emit(-1)">−1</button>
            <button class="cd-btn cd-btn-pos" (click)="changeLife.emit(+1)">+1</button>
            <button class="cd-btn cd-btn-pos" (click)="changeLife.emit(+5)">+5</button>
            <button class="cd-btn cd-btn-pos" (click)="changeLife.emit(+10)">+10</button>
          </div>
          <button class="cd-reset-life" (click)="resetLife.emit()">
            <crown-icon name="RotateCcw" [size]="12"></crown-icon>
            Restaurar vida inicial
          </button>
        </div>

        <!-- COUNTERS -->
        <div class="cd-counters">
          @for (c of counters; track c.key) {
            <div class="cd-counter">
              <div class="cd-counter-icon" [style.color]="c.tint">
                <crown-icon [name]="c.icon" [size]="20"></crown-icon>
              </div>
              <div class="cd-counter-info">
                <div class="cd-counter-label">{{ c.label }}</div>
                <div class="cd-counter-value">{{ value(c.key) }}</div>
              </div>
              <div class="cd-counter-controls">
                <button class="cd-icon-btn cd-icon-btn-sm" (click)="change.emit({ counter: c.key, delta: -1 })" aria-label="Restar">
                  <crown-icon name="Minus" [size]="14"></crown-icon>
                </button>
                <button class="cd-icon-btn cd-icon-btn-sm cd-icon-btn-primary" (click)="change.emit({ counter: c.key, delta: +1 })" aria-label="Sumar">
                  <crown-icon name="Plus" [size]="14"></crown-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <button class="cd-cmd-btn" (click)="openCmdDamage.emit()">
          <crown-icon name="Swords" [size]="14"></crown-icon>
          <span>Commander Damage</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .cd-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .cd-modal {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 32rem;
      max-height: 92vh;
      overflow-y: auto;
      padding: 22px 22px 22px;
      background: #0c0c12;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 22px 22px 0 0;
      color: #e8e8f0;
      margin: 0 auto;
    }
    @media (min-width: 768px) {
      .cd-modal { border-radius: 22px; margin-bottom: 2rem; max-width: 40rem; }
    }

    .cd-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px;
    }
    .cd-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #7a7a90;
    }
    .cd-name {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 22px;
      letter-spacing: -0.02em;
      color: #f5f5fa;
      margin-top: 4px;
    }
    .cd-icon-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #c4c4d0;
      cursor: pointer;
      transition: background 160ms ease, transform 100ms ease;
    }
    .cd-icon-btn:hover { background: rgba(255,255,255,0.1); }
    .cd-icon-btn:active { transform: scale(0.92); }
    .cd-icon-btn-sm {
      width: 34px; height: 34px;
      border-radius: 9px;
    }
    .cd-icon-btn-primary {
      background: linear-gradient(115deg, #ff9ed0, #b39dff, #9dd2ff, #9dffb3, #ffe89d);
      background-size: 300% 100%;
      color: #08080a;
      border-color: transparent;
      animation: chromeFlow 5s linear infinite;
    }
    .cd-icon-btn-primary:hover { background-size: 300% 100%; }

    .cd-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .cd-section-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .cd-life-num {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 300;
      font-size: 38px;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
      color: #f5f5fa;
      line-height: 1;
    }
    .cd-life-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }
    .cd-btn {
      padding: 14px 6px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #e8e8f0;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: background 160ms ease, transform 100ms ease, border-color 160ms ease;
    }
    .cd-btn:active { transform: scale(0.95); }
    .cd-btn-neg:hover { background: rgba(255,122,122,0.12); border-color: rgba(255,122,122,0.4); color: #ff9e9e; }
    .cd-btn-pos:hover { background: rgba(157,255,179,0.12); border-color: rgba(157,255,179,0.4); color: #9dffb3; }

    .cd-counters {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    @media (max-width: 480px) {
      .cd-counters { grid-template-columns: 1fr; }
    }
    .cd-counter {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    .cd-counter-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.04);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .cd-counter-info { flex: 1; min-width: 0; }
    .cd-counter-label {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 12px;
      color: #c4c4d0;
    }
    .cd-counter-value {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 22px;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      color: #f5f5fa;
      line-height: 1;
      margin-top: 2px;
    }
    .cd-counter-controls { display: flex; gap: 5px; }

    .cd-cmd-btn {
      width: 100%;
      padding: 12px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: rgba(255,122,122,0.08);
      border: 1px solid rgba(255,122,122,0.35);
      border-radius: 12px;
      color: #ff9e9e;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 160ms ease;
    }
    .cd-cmd-btn:hover { background: rgba(255,122,122,0.15); }

    .cd-reset-life {
      width: 100%;
      margin-top: 8px;
      padding: 9px 12px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      background: transparent;
      border: 1px dashed rgba(255,255,255,0.2);
      border-radius: 10px;
      color: #c4c4d0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    .cd-reset-life:hover { background: rgba(255,255,255,0.04); color: #f5f5fa; border-color: rgba(255,255,255,0.35); }

    @keyframes chromeFlow {
      0% { background-position: 0% 50%; }
      100% { background-position: 300% 50%; }
    }
  `],
})
export class CounterDrawerComponent {
  @Input({ required: true }) player!: Player;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly change = new EventEmitter<{ counter: CounterType; delta: number }>();
  @Output() readonly changeLife = new EventEmitter<number>();
  @Output() readonly resetLife = new EventEmitter<void>();
  @Output() readonly openCmdDamage = new EventEmitter<void>();

  readonly counters = COUNTERS;
  value(c: CounterType): number { return this.player.counters[c] ?? 0; }
}

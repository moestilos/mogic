import { Component, computed, Input } from '@angular/core';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { IconComponent } from './icon.component';
import type { IconKey } from './icons';

export interface PlayerCardData {
  name: string;
  color: ManaColor;
  avatar: IconKey | string;
  wins?: number;
  games?: number;
  /** Optional best streak. */
  bestStreak?: number;
  /** Optional current streak. */
  streak?: number;
  /** Optional ranking placement (1 = champion). */
  rank?: number;
}

/**
 * Magic-style player card. Rectangular art frame, name banner, color stripe,
 * stat row at bottom. Theme-aware via crown-* primitives.
 */
@Component({
  selector: 'player-card',
  standalone: true,
  imports: [IconComponent, LowerCasePipe, NgClass],
  template: `
    <div class="player-card crown-pod relative overflow-hidden"
         [class.is-active]="rank() === 1"
         [class.player-card--lg]="size === 'lg'"
         [class.player-card--md]="size === 'md'"
         [class.player-card--sm]="size === 'sm'">

      <!-- Color stripe lateral -->
      <div class="crown-pod-stripe" [ngClass]="data.color | lowercase"></div>

      <!-- Art zone (avatar oversized centered) -->
      <div class="player-card-art">
        <crown-icon
          [name]="$any(data.avatar)"
          [size]="artSize()"
          [strokeWidth]="1.2"
          cls="player-card-art-icon"></crown-icon>
        @if (rank()) {
          <div class="player-card-rank"
               [class.player-card-rank--1]="rank() === 1"
               [class.player-card-rank--2]="rank() === 2"
               [class.player-card-rank--3]="rank() === 3">
            #{{ rank() }}
          </div>
        }
      </div>

      <!-- Name + mana -->
      <div class="player-card-name-row">
        <div class="player-card-name" [title]="data.name">{{ data.name }}</div>
        <div class="crown-pip flex-shrink-0" [ngClass]="data.color | lowercase"></div>
      </div>

      <!-- Stats -->
      @if (hasStats()) {
        <div class="player-card-stats">
          @if (data.wins !== undefined) {
            <div class="player-card-stat">
              <div class="player-card-stat-num">{{ data.wins }}</div>
              <div class="player-card-stat-label">Wins</div>
            </div>
          }
          @if (data.games !== undefined) {
            <div class="player-card-stat">
              <div class="player-card-stat-num">{{ data.games }}</div>
              <div class="player-card-stat-label">Games</div>
            </div>
          }
          @if (winRate() !== null) {
            <div class="player-card-stat">
              <div class="player-card-stat-num">{{ winRate() }}<span class="player-card-stat-unit">%</span></div>
              <div class="player-card-stat-label">Rate</div>
            </div>
          }
          @if ((data.streak ?? 0) > 1) {
            <div class="player-card-stat">
              <div class="player-card-stat-num crown-text-danger flex items-center gap-0.5">
                <crown-icon name="Flame" [size]="12"></crown-icon>{{ data.streak }}
              </div>
              <div class="player-card-stat-label">Streak</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .player-card {
      display: flex;
      flex-direction: column;
      padding: 14px 14px 12px;
      min-width: 0;
      transition: transform 180ms ease;
    }
    .player-card:active { transform: scale(0.98); }

    .player-card--sm { padding: 10px 10px 8px; }
    .player-card--lg { padding: 18px 18px 16px; }

    .player-card-art {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 16 / 11;
      width: 100%;
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
      border: 1px solid var(--divider);
      border-radius: calc(var(--pod-radius) - 4px);
      position: relative;
      overflow: hidden;
    }
    [data-theme='brutal'] .player-card-art { border-radius: 0; border-width: 1.5px; }
    [data-theme='stark']  .player-card-art { background: rgba(20,20,14,0.04); }
    [data-theme='sigil']  .player-card-art { background: rgba(201,162,86,0.05); border-color: rgba(201,162,86,0.25); }

    .player-card-art-icon {
      color: var(--text-hi);
      opacity: 0.9;
    }
    [data-theme='chrome'] .player-card.is-active .player-card-art-icon {
      color: var(--accent-flat);
    }
    [data-theme='sigil'] .player-card.is-active .player-card-art-icon {
      color: var(--accent-flat);
      filter: drop-shadow(0 0 12px rgba(201,162,86,0.5));
    }

    .player-card-rank {
      position: absolute;
      top: 6px;
      right: 8px;
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.18em;
      padding: 3px 7px;
      border-radius: 99px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      color: var(--text-lo);
    }
    .player-card-rank--1 {
      color: var(--accent-flat);
      border-color: var(--accent-flat);
      background: transparent;
      box-shadow: 0 0 12px var(--accent-flat);
    }
    .player-card-rank--2 { color: var(--text-mid); border-color: var(--text-mid); }
    .player-card-rank--3 { color: var(--warn); border-color: var(--warn); }

    .player-card-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 10px;
    }
    .player-card-name {
      flex: 1;
      min-width: 0;
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: 18px;
      letter-spacing: -0.02em;
      color: var(--text-hi);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .player-card--sm .player-card-name { font-size: 15px; }
    .player-card--lg .player-card-name { font-size: 22px; }

    .player-card-stats {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--divider);
      flex-wrap: wrap;
    }
    .player-card-stat {
      flex: 1;
      min-width: 40px;
    }
    .player-card-stat-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 20px;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi);
      line-height: 1;
    }
    .player-card-stat-unit {
      font-size: 11px;
      opacity: 0.6;
      margin-left: 1px;
    }
    .player-card-stat-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 3px;
    }
  `],
})
export class PlayerCardComponent {
  @Input({ required: true }) data!: PlayerCardData;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  rank = () => this.data.rank;

  artSize = computed(() => {
    if (this.size === 'sm') return 36;
    if (this.size === 'lg') return 72;
    return 56;
  });

  hasStats(): boolean {
    return this.data.wins !== undefined || this.data.games !== undefined || (this.data.streak ?? 0) > 1;
  }

  winRate(): number | null {
    const w = this.data.wins;
    const g = this.data.games;
    if (w === undefined || g === undefined || g === 0) return null;
    return Math.round((w / g) * 100);
  }
}

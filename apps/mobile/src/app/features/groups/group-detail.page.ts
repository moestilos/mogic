import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { GroupsStore } from '../../core/stores/groups.store';
import { GameStore } from '../../core/stores/game.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import type { IconKey } from '../../shared/icons';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [IonContent, NgClass, LowerCasePipe, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-6 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),6rem)] max-w-5xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        @if (group(); as g) {
          <header class="mb-8 relative z-10">
            <button class="crown-btn-ghost text-sm mb-3 flex items-center gap-1" (click)="back()">
              <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Grupos
            </button>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--bg-input);">
                <crown-icon [name]="iconFor(g.emoji)" [size]="32" cls="crown-text-hi"></crown-icon>
              </div>
              <div>
                <h1 class="crown-display text-4xl">{{ g.name }}</h1>
                <p class="text-sm crown-text-lo">{{ g.profiles.length }} miembros · {{ store.resultsForGroup(g.id).length }} partidas</p>
              </div>
            </div>
          </header>

          <!-- Tabs -->
          <div class="flex gap-2 mb-6 relative z-10">
            <button
              class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'standings' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('standings')">Liga</button>
            <button
              class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'members' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('members')">Miembros</button>
            <button
              class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'history' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('history')">Historia</button>
          </div>

          <!-- STANDINGS -->
          @if (tab() === 'standings') {
            @if (standings().length === 0) {
              <div class="crown-card text-center relative z-10 p-8">
                <p class="crown-text-lo">Aún no hay partidas registradas.</p>
                @if (g.profiles.length >= 2) {
                  <button class="crown-btn-primary mt-4 px-5 py-3 text-xs uppercase tracking-widest"
                          (click)="startSession()">Empezar partida</button>
                }
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                @for (s of standings(); track s.profileId; let i = $index) {
                  <div class="crown-card flex items-center gap-4 p-4"
                       [style.border-color]="i === 0 ? 'var(--accent-flat)' : null"
                       [style.box-shadow]="i === 0 ? 'var(--accent-glow)' : null">
                    <div class="text-3xl w-10 text-center"
                         [class]="rankColor(i)"
                         style="font-family: var(--font-life); font-weight: var(--life-weight); letter-spacing: -0.04em;">{{ i + 1 }}</div>
                    <div class="crown-color-swatch is-on" [ngClass]="s.color | lowercase" style="width:28px;height:28px;"></div>
                    <div class="flex-1 min-w-0">
                      <div class="crown-text-hi truncate" style="font-family: var(--font-name); font-weight: 500;">{{ s.name }}</div>
                      <div class="crown-text-lo text-xs flex gap-3 mt-0.5" style="font-family: var(--font-hud);">
                        <span>{{ s.wins }}W / {{ s.games }}G</span>
                        <span>{{ (s.winRate * 100).toFixed(0) }}%</span>
                        @if (s.currentStreak > 1) {
                          <span class="crown-text-danger inline-flex items-center gap-0.5">
                            <crown-icon name="Flame" [size]="10"></crown-icon>{{ s.currentStreak }}
                          </span>
                        }
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="crown-hud text-[9px]">Avg</div>
                      <div class="text-lg" style="font-family: var(--font-hud); font-variant-numeric: tabular-nums;">{{ s.avgPlacement.toFixed(1) }}</div>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- MEMBERS -->
          @if (tab() === 'members') {
            <div class="space-y-3 mb-6 relative z-10">
              @for (p of g.profiles; track p.id) {
                <div class="crown-card flex items-center gap-3 p-4">
                  <div class="crown-color-swatch is-on" [ngClass]="p.color | lowercase" style="width:32px;height:32px;"></div>
                  <div class="flex-1" style="font-family: var(--font-name); font-weight: 500;">{{ p.name }}</div>
                  <button class="crown-btn-ghost px-2" (click)="removeMember(p.id)" aria-label="Quitar">
                    <crown-icon name="X" [size]="16"></crown-icon>
                  </button>
                </div>
              }
            </div>

            <div class="crown-card relative z-10 p-4">
              <div class="crown-hud mb-3">Añadir miembro</div>
              <input
                class="crown-input mb-3 text-base"
                style="font-family: var(--font-name);"
                [value]="newMemberName()"
                (input)="newMemberName.set($any($event.target).value)"
                placeholder="Nombre"
                maxlength="20" />
              <div class="flex gap-2 mb-4 flex-wrap">
                @for (c of colors; track c) {
                  <button
                    class="crown-color-swatch"
                    [ngClass]="(c | lowercase)"
                    [class.is-on]="newMemberColor() === c"
                    (click)="newMemberColor.set(c)"></button>
                }
              </div>
              <button
                class="crown-btn-primary w-full py-3 text-xs uppercase tracking-widest"
                [disabled]="!canAdd()"
                (click)="addMember()">Añadir</button>
            </div>
          }

          <!-- HISTORY -->
          @if (tab() === 'history') {
            @if (history().length === 0) {
              <div class="crown-card text-center p-8 crown-text-lo relative z-10">Sin partidas todavía.</div>
            } @else {
              <div class="space-y-3 relative z-10">
                @for (r of history(); track r.id) {
                  <div class="crown-card p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="crown-hud">{{ formatDate(r.endedAt) }}</div>
                      <div class="crown-hud">{{ r.format }}</div>
                    </div>
                    <div class="space-y-1">
                      @for (p of r.placements; track p.profileId) {
                        <div class="flex items-center gap-3 text-sm">
                          <div class="w-6"
                               style="font-family: var(--font-hud);"
                               [class]="rankColor(p.placement - 1)">{{ p.placement }}</div>
                          <div style="font-family: var(--font-name);">{{ profileName(p.profileId) }}</div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- Sticky CTA -->
          @if (tab() !== 'history' && g.profiles.length >= 2) {
            <div class="fixed bottom-0 left-0 right-0 px-6 md:px-12 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 z-20"
                 style="background: linear-gradient(to top, var(--bg-base), transparent);">
              <button
                class="crown-btn-primary w-full max-w-5xl mx-auto block py-4 text-sm uppercase tracking-widest"
                (click)="startSession()">Empezar partida con este grupo</button>
            </div>
          }
        } @else {
          <div class="crown-text-lo relative z-10">Grupo no encontrado.</div>
        }
      </div>
    </ion-content>
  `,
})
export class GroupDetailPage implements OnInit {
  readonly store = inject(GroupsStore);
  private readonly game = inject(GameStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'standings' | 'members' | 'history'>('standings');
  readonly colors = COLORS;
  readonly newMemberName = signal('');
  readonly newMemberColor = signal<ManaColor>('U');

  private readonly groupId = signal<string>('');

  readonly group = computed(() => {
    const id = this.groupId();
    return this.store.groups().find((g) => g.id === id) ?? null;
  });

  readonly standings = computed(() => this.store.standingsForGroup(this.groupId()));
  readonly history = computed(() => this.store.resultsForGroup(this.groupId()));

  async ngOnInit() {
    await this.store.load();
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.groupId.set(id);
  }

  canAdd(): boolean { return this.newMemberName().trim().length >= 1; }

  async addMember() {
    if (!this.canAdd()) return;
    void this.haptics.light();
    await this.store.addProfile(this.groupId(), this.newMemberName().trim(), this.newMemberColor());
    this.newMemberName.set('');
  }

  async removeMember(pid: string) {
    void this.haptics.warning();
    await this.store.removeProfile(this.groupId(), pid);
  }

  rankColor(idx: number): string {
    if (idx === 0) return 'crown-text-accent';
    if (idx === 1) return 'crown-text-success';
    if (idx === 2) return 'crown-text-warn';
    return 'crown-text-lo';
  }

  profileName(pid: string): string {
    return this.group()?.profiles.find((p) => p.id === pid)?.name ?? '?';
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  iconFor(raw: string | undefined): IconKey {
    if (!raw) return 'Crown';
    if (raw.length > 4) return raw as IconKey;
    return 'Crown';
  }

  back() { void this.router.navigate(['/groups']); }

  startSession() {
    const g = this.group();
    if (!g || g.profiles.length < 2) return;
    void this.haptics.medium();
    this.game.start({
      format: 'commander',
      players: g.profiles.map((p) => ({ name: p.name, color: p.color })),
    });
    const snapshot = this.game.game();
    if (snapshot) {
      const mapping: Record<string, string> = {};
      snapshot.players.forEach((player, i) => {
        const profile = g.profiles[i];
        if (profile) mapping[player.id] = profile.id;
      });
      this.store.setActiveSession(g.id, mapping);
    }
    void this.router.navigate(['/game']);
  }
}

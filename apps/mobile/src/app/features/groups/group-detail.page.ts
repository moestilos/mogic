import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { GroupsStore } from '../../core/stores/groups.store';
import { GameStore } from '../../core/stores/game.store';
import { ProfileStore, type Friend } from '../../core/stores/profile.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { PlayerCardComponent } from '../../shared/player-card.component';
import type { IconKey } from '../../shared/icons';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [IonContent, NgClass, LowerCasePipe, AnimatedBackgroundComponent, IconComponent, PlayerCardComponent],
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
            <button class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'standings' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('standings')">Liga</button>
            <button class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'members' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('members')">Miembros</button>
            <button class="flex-1 py-3 text-xs uppercase tracking-widest"
              [class]="tab() === 'history' ? 'crown-btn-primary' : 'crown-btn'"
              (click)="tab.set('history')">Historia</button>
          </div>

          <!-- STANDINGS -->
          @if (tab() === 'standings') {
            @if (standings().length === 0) {
              <div class="crown-card text-center relative z-10 p-8">
                <crown-icon name="Trophy" [size]="32" cls="crown-text-lo mb-3 block"></crown-icon>
                <p class="crown-text-lo mb-4">Sin partidas todavía.<br>Juega la primera para ver la clasificación.</p>
                @if (g.profiles.length >= 2) {
                  <button class="crown-btn-primary px-6 py-3 text-xs uppercase tracking-widest"
                          (click)="openSelection()">Empezar partida</button>
                }
              </div>
            } @else {
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
                @for (s of standings(); track s.profileId; let i = $index) {
                  <player-card
                    size="md"
                    [data]="{
                      name: s.name,
                      color: s.color,
                      avatar: profileAvatar(s.profileId),
                      wins: s.wins,
                      games: s.games,
                      streak: s.currentStreak,
                      rank: i + 1
                    }"></player-card>
                }
              </div>
            }
          }

          <!-- MEMBERS -->
          @if (tab() === 'members') {
            <!-- Member list -->
            <div class="space-y-2 mb-5 relative z-10">
              @for (p of g.profiles; track p.id) {
                <div class="crown-card flex items-center gap-3 p-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 crown-color-swatch is-on" [ngClass]="p.color | lowercase">
                    <crown-icon [name]="$any(p.avatar ?? 'User')" [size]="18" cls="crown-text-hi"></crown-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div style="font-family: var(--font-name); font-weight: 500;">{{ p.name }}</div>
                  </div>
                  <button class="crown-btn-ghost w-8 h-8 flex items-center justify-center" (click)="removeMember(p.id)" aria-label="Quitar">
                    <crown-icon name="X" [size]="15"></crown-icon>
                  </button>
                </div>
              }
              @if (g.profiles.length === 0) {
                <div class="crown-card text-center p-6 crown-text-lo text-sm relative z-10">
                  Sin miembros. Añade al menos 2 para empezar.
                </div>
              }
            </div>

            <!-- Add section -->
            @if (!addingFromFriend() && !addingManual()) {
              <div class="flex flex-col gap-2 relative z-10">
                @if (availableFriends().length > 0) {
                  <button class="crown-btn py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                          (click)="addingFromFriend.set(true)">
                    <crown-icon name="UserPlus" [size]="14"></crown-icon> Añadir desde amigos
                  </button>
                }
                <button class="crown-btn py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        (click)="addingManual.set(true)">
                  <crown-icon name="Plus" [size]="14"></crown-icon> Añadir manualmente
                </button>
              </div>
            }

            <!-- Friend picker -->
            @if (addingFromFriend()) {
              <div class="crown-card relative z-10 p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="crown-hud">Seleccionar amigo</div>
                  <button class="crown-btn-ghost w-8 h-8 flex items-center justify-center" (click)="addingFromFriend.set(false)">
                    <crown-icon name="X" [size]="14"></crown-icon>
                  </button>
                </div>
                <div class="space-y-2">
                  @for (f of availableFriends(); track f.id) {
                    <button class="w-full flex items-center gap-3 p-3 rounded-lg text-left active:scale-[0.99] transition"
                            style="background: var(--bg-input);"
                            (click)="addFromFriend(f)">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 crown-color-swatch is-on" [ngClass]="f.color | lowercase">
                        <crown-icon [name]="$any(f.avatar)" [size]="18" cls="crown-text-hi"></crown-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div style="font-family: var(--font-name); font-weight: 500;">{{ f.name }}</div>
                        @if (f.wins > 0 || f.games > 0) {
                          <div class="crown-text-lo text-xs mt-0.5" style="font-family: var(--font-hud); letter-spacing: 0.1em;">
                            {{ f.wins }}V · {{ f.games }}P
                          </div>
                        }
                      </div>
                      <crown-icon name="ChevronRight" [size]="14" cls="crown-text-lo"></crown-icon>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Manual form -->
            @if (addingManual()) {
              <div class="crown-card relative z-10 p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="crown-hud">Añadir manualmente</div>
                  <button class="crown-btn-ghost w-8 h-8 flex items-center justify-center" (click)="addingManual.set(false)">
                    <crown-icon name="X" [size]="14"></crown-icon>
                  </button>
                </div>
                <input
                  class="crown-input mb-3 text-base"
                  style="font-family: var(--font-name);"
                  [value]="newMemberName()"
                  (input)="newMemberName.set($any($event.target).value)"
                  placeholder="Nombre"
                  maxlength="20" />
                <div class="flex gap-2 mb-4 flex-wrap">
                  @for (c of colors; track c) {
                    <button class="crown-color-swatch" [ngClass]="(c | lowercase)"
                            [class.is-on]="newMemberColor() === c"
                            (click)="newMemberColor.set(c)"></button>
                  }
                </div>
                <button class="crown-btn-primary w-full py-3 text-xs uppercase tracking-widest"
                        [disabled]="!canAdd()"
                        (click)="addMember()">Añadir</button>
              </div>
            }
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
                    <div class="space-y-1.5">
                      @for (p of r.placements; track p.profileId) {
                        <div class="flex items-center gap-3 text-sm">
                          <div class="w-5 text-center flex-shrink-0"
                               style="font-family: var(--font-hud);"
                               [class]="rankColor(p.placement - 1)">{{ p.placement }}</div>
                          <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 crown-color-swatch is-on" [ngClass]="profileColor(p.profileId)">
                            <crown-icon [name]="$any(profileAvatar(p.profileId))" [size]="12" cls="crown-text-hi"></crown-icon>
                          </div>
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
          @if (tab() !== 'history' && g.profiles.length >= 2 && !selecting()) {
            <div class="fixed bottom-0 left-0 right-0 px-6 md:px-12 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 z-20"
                 style="background: linear-gradient(to top, var(--bg-base) 70%, transparent);">
              <button class="crown-btn-primary w-full max-w-5xl mx-auto block py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                      (click)="openSelection()">
                <crown-icon name="Swords" [size]="15"></crown-icon>
                Empezar partida
              </button>
            </div>
          }
        } @else {
          <div class="crown-text-lo relative z-10">Grupo no encontrado.</div>
        }
      </div>

      <!-- ── Player Selection Bottom Sheet ── -->
      @if (selecting() && group(); as g) {
        <div class="fixed inset-0 z-50 flex items-end"
             style="background: rgba(0,0,0,0.65);"
             (click)="selecting.set(false)">
          <div class="w-full max-w-5xl mx-auto rounded-t-2xl overflow-hidden"
               style="background: var(--bg-pod); border-top: 1px solid var(--divider);"
               (click)="$event.stopPropagation()">

            <div class="px-5 pt-5 pb-2">
              <div class="flex items-center justify-between mb-1">
                <div class="crown-display text-xl">¿Quién juega?</div>
                <button class="crown-btn-ghost w-8 h-8 flex items-center justify-center" (click)="selecting.set(false)">
                  <crown-icon name="X" [size]="16"></crown-icon>
                </button>
              </div>
              <div class="crown-text-lo text-[10px] mb-4" style="font-family: var(--font-hud); letter-spacing: 0.14em;">
                {{ selectedIds().size }} SELECCIONADOS · MÍN 2 · MÁX 4
              </div>
            </div>

            <!-- Member grid -->
            <div class="px-4 pb-2 grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
              @for (p of g.profiles; track p.id) {
                <button
                  class="flex items-center gap-3 p-3 rounded-xl text-left transition active:scale-[0.97]"
                  [style]="selectedIds().has(p.id)
                    ? 'background: var(--bg-input); border: 1.5px solid var(--accent);'
                    : 'background: var(--bg-input); border: 1.5px solid var(--divider);'"
                  (click)="toggleSelect(p.id)">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 crown-color-swatch is-on" [ngClass]="p.color | lowercase">
                    <crown-icon [name]="$any(p.avatar ?? 'User')" [size]="16" cls="crown-text-hi"></crown-icon>
                  </div>
                  <span class="flex-1 text-sm truncate" style="font-family: var(--font-name); font-weight: 500;">{{ p.name }}</span>
                  @if (selectedIds().has(p.id)) {
                    <crown-icon name="Check" [size]="14" cls="crown-text-accent flex-shrink-0"></crown-icon>
                  }
                </button>
              }
            </div>

            <div class="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
              <button class="crown-btn-primary w-full py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                      [disabled]="!canStartSelected()"
                      (click)="startWithSelected()">
                <crown-icon name="Swords" [size]="15"></crown-icon>
                Iniciar con {{ selectedIds().size }} jugadores
              </button>
            </div>
          </div>
        </div>
      }
    </ion-content>
  `,
})
export class GroupDetailPage implements OnInit {
  readonly store = inject(GroupsStore);
  private readonly game = inject(GameStore);
  readonly profile = inject(ProfileStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'standings' | 'members' | 'history'>('standings');
  readonly colors = COLORS;
  readonly newMemberName = signal('');
  readonly newMemberColor = signal<ManaColor>('U');
  readonly selecting = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly addingFromFriend = signal(false);
  readonly addingManual = signal(false);

  private readonly groupId = signal<string>('');

  readonly group = computed(() => {
    const id = this.groupId();
    return this.store.groups().find((g) => g.id === id) ?? null;
  });

  readonly standings = computed(() => this.store.standingsForGroup(this.groupId()));
  readonly history = computed(() => this.store.resultsForGroup(this.groupId()));

  readonly availableFriends = computed(() => {
    const group = this.group();
    const friends = this.profile.friends();
    if (!group) return friends;
    const groupNames = new Set(group.profiles.map((p) => p.name.toLowerCase()));
    return friends.filter((f) => !groupNames.has(f.name.toLowerCase()));
  });

  readonly canStartSelected = computed(() => {
    const n = this.selectedIds().size;
    return n >= 2 && n <= 4;
  });

  async ngOnInit() {
    await Promise.all([this.store.load(), this.profile.load()]);
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.groupId.set(id);
  }

  canAdd(): boolean { return this.newMemberName().trim().length >= 1; }

  async addMember() {
    if (!this.canAdd()) return;
    void this.haptics.light();
    await this.store.addProfile(this.groupId(), this.newMemberName().trim(), this.newMemberColor());
    this.newMemberName.set('');
    this.addingManual.set(false);
  }

  async addFromFriend(f: Friend) {
    void this.haptics.light();
    await this.store.addProfileFromFriend(this.groupId(), f);
    this.addingFromFriend.set(false);
  }

  async removeMember(pid: string) {
    void this.haptics.warning();
    await this.store.removeProfile(this.groupId(), pid);
  }

  openSelection() {
    const g = this.group();
    if (!g || g.profiles.length < 2) return;
    void this.haptics.medium();
    const ids = new Set(g.profiles.slice(0, 4).map((p) => p.id));
    this.selectedIds.set(ids);
    this.selecting.set(true);
  }

  toggleSelect(profileId: string) {
    void this.haptics.light();
    const ids = new Set(this.selectedIds());
    if (ids.has(profileId)) {
      ids.delete(profileId);
    } else if (ids.size < 4) {
      ids.add(profileId);
    }
    this.selectedIds.set(ids);
  }

  startWithSelected() {
    if (!this.canStartSelected()) return;
    const g = this.group();
    if (!g) return;
    const selected = g.profiles.filter((p) => this.selectedIds().has(p.id));
    void this.haptics.medium();
    this.game.start({
      format: 'commander',
      players: selected.map((p) => ({ name: p.name, color: p.color })),
    });
    const snapshot = this.game.game();
    if (snapshot) {
      const mapping: Record<string, string> = {};
      snapshot.players.forEach((player, i) => {
        if (selected[i]) mapping[player.id] = selected[i].id;
      });
      this.store.setActiveSession(g.id, mapping);
    }
    this.selecting.set(false);
    void this.router.navigate(['/game']);
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

  profileAvatar(pid: string): string {
    return this.group()?.profiles.find((p) => p.id === pid)?.avatar ?? 'User';
  }

  profileColor(pid: string): string {
    return (this.group()?.profiles.find((p) => p.id === pid)?.color ?? 'C').toLowerCase();
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
}

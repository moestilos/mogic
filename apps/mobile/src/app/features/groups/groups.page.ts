import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { GroupsStore } from '../../core/stores/groups.store';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import type { IconKey } from '../../shared/icons';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [IonContent, AnimatedBackgroundComponent, IconComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-6 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-5xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-8 flex items-start justify-between relative z-10">
          <div>
            <button class="crown-btn-ghost text-sm mb-2 flex items-center gap-1" (click)="back()">
              <crown-icon name="ChevronLeft" [size]="14"></crown-icon> Inicio
            </button>
            <h1 class="crown-display text-4xl">Grupos</h1>
            <p class="text-sm mt-1 crown-text-lo">Tu liga personal de Magic</p>
          </div>
          <button class="crown-btn-primary px-5 py-3 text-xs uppercase tracking-widest flex items-center gap-2"
                  (click)="newGroup()">
            <crown-icon name="Plus" [size]="14"></crown-icon> Nuevo
          </button>
        </header>

        @if (store.groups().length === 0) {
          <div class="crown-card text-center mt-12 relative z-10 p-10">
            <crown-icon name="Users" [size]="48" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
            <div class="crown-display text-xl mb-2 mt-3">Ningún grupo todavía</div>
            <p class="text-sm mb-6 crown-text-lo">Crea uno para empezar a registrar partidas, ganadores y rachas.</p>
            <button class="crown-btn-primary px-6 py-3 text-xs uppercase tracking-widest"
                    (click)="newGroup()">Crear primer grupo</button>
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 relative z-10">
          @for (g of store.groups(); track g.id) {
            <button class="crown-card text-left transition active:scale-[0.98]"
                    (click)="open(g.id)">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--bg-input);">
                  <crown-icon [name]="iconFor(g.emoji)" [size]="24" cls="crown-text-hi"></crown-icon>
                </div>
                <div class="crown-display text-xl">{{ g.name }}</div>
              </div>
              <div class="flex gap-6 crown-hud text-[10px]">
                <div><span class="crown-text-hi text-base" style="font-family: var(--font-life);">{{ g.profiles.length }}</span> miembros</div>
                <div><span class="crown-text-hi text-base" style="font-family: var(--font-life);">{{ resultsCount(g.id) }}</span> partidas</div>
              </div>
            </button>
          }
        </div>
      </div>
    </ion-content>
  `,
})
export class GroupsPage implements OnInit {
  readonly store = inject(GroupsStore);
  private readonly router = inject(Router);

  async ngOnInit() { await this.store.load(); }
  resultsCount(groupId: string): number { return this.store.resultsForGroup(groupId).length; }
  iconFor(raw: string | undefined): IconKey {
    if (!raw) return 'Crown';
    // Backward compat: emojis stored before lucide migration → Crown fallback.
    if (raw.length > 4) return raw as IconKey;
    return 'Crown';
  }
  back() { void this.router.navigate(['/']); }
  newGroup() { void this.router.navigate(['/groups/new']); }
  open(id: string) { void this.router.navigate(['/groups', id]); }
}

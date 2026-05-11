import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { ProfileStore } from '../../core/stores/profile.store';
import { AuthStore } from '../../core/stores/auth.store';
import { HapticsService } from '../../core/services/haptics.service';
import { AnimatedBackgroundComponent } from '../../shared/animated-background.component';
import { IconComponent } from '../../shared/icon.component';
import { PlayerCardComponent } from '../../shared/player-card.component';
import { AVATAR_ICONS, type IconKey } from '../../shared/icons';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, LowerCasePipe, NgClass, AnimatedBackgroundComponent, IconComponent, PlayerCardComponent],
  template: `
    <ion-content [fullscreen]="true" class="ion-no-padding">
      <div class="min-h-screen px-5 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] max-w-4xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <!-- Top nav -->
        <header class="mb-5 relative z-10 flex items-center justify-between gap-3">
          <button class="profile-icon-btn" (click)="back()" aria-label="Atrás">
            <crown-icon name="ChevronLeft" [size]="18"></crown-icon>
          </button>
          <h1 class="crown-hud">Mi perfil</h1>
          <button class="profile-icon-btn" (click)="signOut()" aria-label="Salir">
            <crown-icon name="LogOut" [size]="16"></crown-icon>
          </button>
        </header>

        @if (store.me(); as me) {
          <!-- Hero card -->
          <div class="profile-hero relative z-10 mb-5">
            <div class="profile-hero-stripe" [ngClass]="me.color | lowercase"></div>
            <div class="flex items-center gap-4 p-5">
              <div class="profile-avatar">
                <crown-icon [name]="$any(me.avatar)" [size]="40" [strokeWidth]="1.2"></crown-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="crown-display profile-hero-name truncate">{{ me.name }}</div>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <div class="profile-handle">&#64;{{ handle() }}</div>
                  <div class="profile-color-chip" [ngClass]="me.color | lowercase">
                    <div class="crown-pip" [ngClass]="me.color | lowercase"></div>
                    {{ me.color }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Hero stats -->
            <div class="profile-hero-stats">
              <div class="profile-hero-stat">
                <div class="profile-hero-stat-num crown-text-accent">{{ totalWins() }}</div>
                <div class="profile-hero-stat-label">Wins</div>
              </div>
              <div class="profile-hero-stat">
                <div class="profile-hero-stat-num">{{ totalGames() }}</div>
                <div class="profile-hero-stat-label">Partidas</div>
              </div>
              <div class="profile-hero-stat">
                <div class="profile-hero-stat-num">{{ avgWinRate() }}<span class="opacity-50 text-sm">%</span></div>
                <div class="profile-hero-stat-label">Avg rate</div>
              </div>
              <div class="profile-hero-stat">
                <div class="profile-hero-stat-num crown-text-danger flex items-center gap-1 justify-center">
                  <crown-icon name="Flame" [size]="20"></crown-icon>{{ bestStreak() }}
                </div>
                <div class="profile-hero-stat-label">Best</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="profile-tabs relative z-10 mb-5">
            <button class="profile-tab" [class.is-on]="tab() === 'friends'" (click)="tab.set('friends')">
              <crown-icon name="Users" [size]="14"></crown-icon> Amigos
              <span class="profile-tab-count">{{ store.friends().length }}</span>
            </button>
            <button class="profile-tab" [class.is-on]="tab() === 'stats'" (click)="tab.set('stats')">
              <crown-icon name="Trophy" [size]="14"></crown-icon> Stats
            </button>
            <button class="profile-tab" [class.is-on]="tab() === 'settings'" (click)="tab.set('settings')">
              <crown-icon name="Settings" [size]="14"></crown-icon> Ajustes
            </button>
          </div>

          <!-- FRIENDS TAB -->
          @if (tab() === 'friends') {
            <div class="relative z-10">
              <!-- Search + add CTA row -->
              <div class="flex gap-2 mb-4">
                <div class="profile-search flex-1">
                  <crown-icon name="Search" [size]="15" cls="crown-text-lo"></crown-icon>
                  <input class="profile-search-input"
                         [value]="searchQuery()"
                         (input)="searchQuery.set($any($event.target).value)"
                         placeholder="Buscar amigos..."
                         autocapitalize="off" />
                  @if (searchQuery().length > 0) {
                    <button class="crown-btn-ghost" (click)="searchQuery.set('')" aria-label="Limpiar">
                      <crown-icon name="X" [size]="13"></crown-icon>
                    </button>
                  }
                </div>
                <button class="crown-btn-primary px-4 flex items-center gap-1.5 text-[11px] uppercase tracking-widest"
                        (click)="addOpen.set(true)">
                  <crown-icon name="UserPlus" [size]="13"></crown-icon> Añadir
                </button>
              </div>

              <!-- Empty state -->
              @if (store.friends().length === 0 && discoverable().length === 0) {
                <div class="profile-empty">
                  <crown-icon name="Users" [size]="44" [strokeWidth]="1.2" cls="crown-text-lo"></crown-icon>
                  <p class="profile-empty-title">Sin amigos todavía</p>
                  <p class="profile-empty-sub">Añade los compañeros de mesa para llevar tracking de wins.</p>
                  <button class="crown-btn-primary mt-4 px-5 py-3 text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
                          (click)="addOpen.set(true)">
                    <crown-icon name="UserPlus" [size]="14"></crown-icon> Añadir primer amigo
                  </button>
                </div>
              }

              <!-- Discover device accounts (suggested) -->
              @if (discoverable().length > 0) {
                <section class="mb-5">
                  <div class="crown-hud mb-2.5 flex items-center gap-1.5">
                    <crown-icon name="Sparkles" [size]="11"></crown-icon> Sugerencias en este dispositivo
                  </div>
                  <div class="space-y-2">
                    @for (a of discoverable(); track a.id) {
                      <div class="profile-suggest">
                        <div class="profile-suggest-avatar">
                          <crown-icon [name]="$any(a.avatar)" [size]="20"></crown-icon>
                        </div>
                        <div class="crown-pip" [ngClass]="a.color | lowercase"></div>
                        <div class="flex-1 min-w-0">
                          <div class="profile-suggest-name">{{ a.displayName }}</div>
                          <div class="profile-suggest-email">{{ a.email }}</div>
                        </div>
                        <button class="crown-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest flex items-center gap-1"
                                (click)="addFromAccount(a)">
                          <crown-icon name="UserPlus" [size]="11"></crown-icon> Añadir
                        </button>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Friends grid -->
              @if (store.friends().length > 0) {
                <section>
                  <div class="crown-hud mb-2.5 flex items-center gap-1.5">
                    <crown-icon name="Users" [size]="11"></crown-icon>
                    Mis amigos
                    @if (searchQuery()) {
                      <span class="crown-text-lo">· {{ filteredFriends().length }} resultados</span>
                    }
                  </div>
                  @if (filteredFriends().length === 0) {
                    <div class="profile-empty">
                      <crown-icon name="Search" [size]="28" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
                      <p class="crown-text-lo text-sm mt-2">Sin resultados para "{{ searchQuery() }}"</p>
                    </div>
                  } @else {
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                      @for (f of filteredFriends(); track f.id; let i = $index) {
                        <div class="relative">
                          <player-card
                            size="md"
                            [data]="{
                              name: f.name,
                              color: f.color,
                              avatar: $any(f.avatar),
                              wins: f.wins,
                              games: f.games,
                              rank: rankOf(f.id)
                            }"></player-card>
                          <button class="profile-card-del" (click)="remove(f.id)" aria-label="Eliminar amigo">
                            <crown-icon name="Trash2" [size]="12"></crown-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </section>
              }
            </div>
          }

          <!-- STATS TAB -->
          @if (tab() === 'stats') {
            <div class="relative z-10 space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Users" [size]="16" cls="crown-text-mid"></crown-icon></div>
                  <div class="profile-stat-num">{{ store.friends().length }}</div>
                  <div class="profile-stat-label">Amigos</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Dices" [size]="16" cls="crown-text-mid"></crown-icon></div>
                  <div class="profile-stat-num">{{ totalGames() }}</div>
                  <div class="profile-stat-label">Partidas</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Trophy" [size]="16" cls="crown-text-accent"></crown-icon></div>
                  <div class="profile-stat-num crown-text-accent">{{ totalWins() }}</div>
                  <div class="profile-stat-label">Wins amigos</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Flame" [size]="16" cls="crown-text-danger"></crown-icon></div>
                  <div class="profile-stat-num">{{ bestStreak() }}</div>
                  <div class="profile-stat-label">Best streak</div>
                </div>
              </div>

              @if (topFriend(); as top) {
                <div>
                  <div class="crown-hud mb-2.5 flex items-center gap-1.5">
                    <crown-icon name="Trophy" [size]="11" cls="crown-text-accent"></crown-icon> King of the table
                  </div>
                  <player-card
                    size="lg"
                    [data]="{
                      name: top.name,
                      color: top.color,
                      avatar: $any(top.avatar),
                      wins: top.wins,
                      games: top.games,
                      rank: 1
                    }"></player-card>
                </div>
              }

              @if (podium().length > 0) {
                <div>
                  <div class="crown-hud mb-2.5">Top 3</div>
                  <div class="grid grid-cols-3 gap-2">
                    @for (f of podium(); track f.id; let i = $index) {
                      <player-card
                        size="sm"
                        [data]="{
                          name: f.name,
                          color: f.color,
                          avatar: $any(f.avatar),
                          wins: f.wins,
                          games: f.games,
                          rank: i + 1
                        }"></player-card>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- SETTINGS TAB -->
          @if (tab() === 'settings') {
            <div class="relative z-10 space-y-3">
              <button class="profile-setting" (click)="goTheme()">
                <div class="profile-setting-icon"><crown-icon name="Sparkles" [size]="18"></crown-icon></div>
                <div class="flex-1 text-left min-w-0">
                  <div class="profile-setting-title">Tema visual</div>
                  <div class="profile-setting-sub">Cambia la estética de la app</div>
                </div>
                <crown-icon name="ChevronLeft" [size]="16" cls="crown-text-lo" style="transform: rotate(180deg);"></crown-icon>
              </button>

              <button class="profile-setting" (click)="signOut()">
                <div class="profile-setting-icon"><crown-icon name="LogOut" [size]="18" cls="crown-text-danger"></crown-icon></div>
                <div class="flex-1 text-left min-w-0">
                  <div class="profile-setting-title crown-text-danger">Cerrar sesión</div>
                  <div class="profile-setting-sub">Volverás a la pantalla de entrada</div>
                </div>
              </button>
            </div>
          }
        }
      </div>

      <!-- Add friend modal -->
      @if (addOpen()) {
        <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center" (click)="addOpen.set(false)">
          <div class="profile-modal-backdrop"></div>
          <div class="profile-modal" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="crown-hud">Nuevo amigo</div>
                <div class="profile-modal-title">Añadir compañero</div>
              </div>
              <button class="profile-icon-btn" (click)="addOpen.set(false)" aria-label="Cerrar">
                <crown-icon name="X" [size]="18"></crown-icon>
              </button>
            </div>

            <label class="crown-hud block mb-1.5">Nombre</label>
            <input class="crown-input mb-4"
                   style="font-family: var(--font-name);"
                   [value]="newName()"
                   (input)="newName.set($any($event.target).value)"
                   placeholder="Mateo"
                   maxlength="20" />

            <label class="crown-hud block mb-2">Color</label>
            <div class="flex gap-1.5 mb-4 flex-wrap">
              @for (c of colors; track c) {
                <button class="crown-color-swatch"
                        [ngClass]="(c | lowercase)"
                        [class.is-on]="newColor() === c"
                        (click)="newColor.set(c)"
                        [attr.aria-label]="c"></button>
              }
            </div>

            <label class="crown-hud block mb-2">Avatar</label>
            <div class="grid grid-cols-6 gap-1.5 mb-4 max-h-[34vh] overflow-y-auto pr-1">
              @for (a of avatars; track a) {
                <button class="aspect-square flex items-center justify-center"
                        [class]="newAvatar() === a ? 'crown-btn-primary' : 'crown-btn'"
                        (click)="newAvatar.set(a)">
                  <crown-icon [name]="a" [size]="18"></crown-icon>
                </button>
              }
            </div>

            <button class="crown-btn-primary w-full py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    [disabled]="!canAdd()"
                    (click)="add()">
              <crown-icon name="UserPlus" [size]="13"></crown-icon> Añadir amigo
            </button>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .profile-icon-btn {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--divider);
      border-radius: 10px;
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease, transform 120ms ease;
    }
    .profile-icon-btn:active { transform: scale(0.94); }
    .profile-icon-btn:hover { background: rgba(255,255,255,0.08); }
    [data-theme='brutal'] .profile-icon-btn { border-radius: 0; border-width: 1.5px; }
    [data-theme='stark']  .profile-icon-btn { background: rgba(20,20,14,0.04); }

    /* Hero card */
    .profile-hero {
      background: var(--bg-pod);
      border: 1px solid var(--bg-pod-border);
      border-radius: var(--pod-radius);
      overflow: hidden;
      position: relative;
    }
    [data-theme='stark']  .profile-hero { background: rgba(20,20,14,0.03); border-color: var(--divider); }
    .profile-hero-stripe {
      position: absolute;
      top: 0; bottom: 0; left: 0;
      width: 4px;
    }
    .profile-hero-stripe.w { background: linear-gradient(180deg, #FFFDE0, #F8E9B4); }
    .profile-hero-stripe.u { background: linear-gradient(180deg, #B7DDF8, #4F8FCB); }
    .profile-hero-stripe.b { background: linear-gradient(180deg, #4d4253, #1a1620); }
    .profile-hero-stripe.r { background: linear-gradient(180deg, #F8B7B0, #D24F45); }
    .profile-hero-stripe.g { background: linear-gradient(180deg, #BFE6A6, #5A9A4C); }
    .profile-hero-stripe.c { background: linear-gradient(180deg, #d8d8e0, #8b8b9e); }

    .profile-avatar {
      width: 72px; height: 72px;
      border-radius: 18px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--divider);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-hi);
      flex-shrink: 0;
    }
    [data-theme='brutal'] .profile-avatar { border-radius: 0; border-width: 1.5px; }
    [data-theme='chrome'] .profile-avatar {
      background: linear-gradient(135deg, rgba(255,158,208,0.1), rgba(179,157,255,0.1), rgba(157,210,255,0.08));
      border-color: rgba(179,157,255,0.3);
    }
    [data-theme='sigil']  .profile-avatar { background: rgba(201,162,86,0.08); border-color: rgba(201,162,86,0.4); color: var(--accent-flat); }

    .profile-hero-name {
      font-size: clamp(28px, 6vw, 38px);
      letter-spacing: -0.03em;
      line-height: 1.05;
    }
    .profile-handle {
      font-family: var(--font-hud);
      font-size: 11px;
      letter-spacing: 0.06em;
      color: var(--text-lo);
      padding: 3px 8px;
      background: rgba(255,255,255,0.04);
      border-radius: 99px;
    }
    .profile-color-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-mid);
      padding: 3px 8px;
      background: rgba(255,255,255,0.04);
      border-radius: 99px;
    }

    .profile-hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--divider);
    }
    .profile-hero-stat {
      padding: 12px 8px;
      text-align: center;
      border-right: 1px solid var(--divider);
    }
    .profile-hero-stat:last-child { border-right: none; }
    .profile-hero-stat-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 24px;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi);
      line-height: 1;
    }
    .profile-hero-stat-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 5px;
    }

    /* Tabs */
    .profile-tabs {
      display: flex;
      gap: 6px;
      padding: 4px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: 12px;
    }
    [data-theme='stark'] .profile-tabs { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .profile-tabs { border-radius: 0; padding: 0; gap: 0; }
    .profile-tab {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 8px;
      background: transparent;
      border: none;
      color: var(--text-lo);
      font-family: var(--font-btn);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      border-radius: 8px;
      cursor: pointer;
      transition: background 180ms ease, color 180ms ease;
    }
    [data-theme='brutal'] .profile-tab { border-radius: 0; border-right: 1.5px solid var(--text-hi); }
    [data-theme='brutal'] .profile-tab:last-child { border-right: none; }
    .profile-tab:hover { color: var(--text-mid); }
    .profile-tab.is-on {
      background: var(--accent);
      color: var(--accent-text);
    }
    [data-theme='chrome'] .profile-tab.is-on {
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    .profile-tab-count {
      background: rgba(255,255,255,0.15);
      padding: 1px 6px;
      border-radius: 99px;
      font-size: 9px;
    }
    .profile-tab.is-on .profile-tab-count {
      background: rgba(0,0,0,0.18);
    }

    /* Search */
    .profile-search {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--input-radius);
    }
    .profile-search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-hi);
      font-family: var(--font-name);
      font-size: 14px;
    }
    .profile-search-input::placeholder { color: var(--text-lo); }

    /* Empty state */
    .profile-empty {
      text-align: center;
      padding: 32px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='brutal'] .profile-empty { border-radius: 0; border-style: solid; border-width: 1.5px; }
    .profile-empty-title {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: 17px;
      color: var(--text-mid);
      margin-top: 12px;
    }
    .profile-empty-sub {
      font-size: 12px;
      color: var(--text-lo);
      margin-top: 4px;
    }

    /* Suggest device account row */
    .profile-suggest {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .profile-suggest { background: rgba(20,20,14,0.03); }
    .profile-suggest-avatar {
      width: 36px; height: 36px;
      background: var(--bg-input);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-hi);
      flex-shrink: 0;
    }
    [data-theme='brutal'] .profile-suggest-avatar { border-radius: 0; }
    .profile-suggest-name {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 14px;
      color: var(--text-hi);
    }
    .profile-suggest-email {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.06em;
      color: var(--text-lo);
      margin-top: 2px;
    }

    /* Card del */
    .profile-card-del {
      position: absolute;
      top: 6px; left: 6px;
      z-index: 10;
      width: 26px; height: 26px;
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 99px;
      color: #e8e8f0;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background 160ms ease;
    }
    .profile-card-del:hover { background: var(--danger); }

    /* Stats cards */
    .profile-stat-card {
      padding: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .profile-stat-card { background: rgba(20,20,14,0.03); }
    .profile-stat-icon {
      width: 32px; height: 32px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    [data-theme='brutal'] .profile-stat-icon { border-radius: 0; }
    .profile-stat-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 28px;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi);
      line-height: 1;
    }
    .profile-stat-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 5px;
    }

    /* Settings rows */
    .profile-setting {
      width: 100%;
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
      cursor: pointer;
      transition: background 160ms ease;
    }
    .profile-setting:hover { background: rgba(255,255,255,0.06); }
    [data-theme='stark'] .profile-setting { background: rgba(20,20,14,0.03); }
    .profile-setting-icon {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-mid);
    }
    [data-theme='brutal'] .profile-setting-icon { border-radius: 0; }
    .profile-setting-title {
      font-family: var(--font-name);
      font-weight: 600;
      font-size: 14px;
      color: var(--text-hi);
    }
    .profile-setting-sub {
      font-size: 12px;
      color: var(--text-lo);
      margin-top: 2px;
    }

    /* Add friend modal */
    .profile-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .profile-modal {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 28rem;
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
      .profile-modal { border-radius: 22px; margin-bottom: 2rem; }
    }
    .profile-modal-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      font-size: 22px;
      letter-spacing: -0.02em;
      margin-top: 4px;
      color: #f5f5fa;
    }
  `],
})
export class ProfilePage implements OnInit {
  readonly store = inject(ProfileStore);
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'friends' | 'stats' | 'settings'>('friends');
  readonly colors = COLORS;
  readonly avatars = AVATAR_ICONS;

  readonly searchQuery = signal('');
  readonly addOpen = signal(false);

  readonly newName = signal('');
  readonly newColor = signal<ManaColor>('R');
  readonly newAvatar = signal<IconKey>('User');

  readonly handle = computed(() => {
    const me = this.auth.me();
    return me?.username ?? this.store.me()?.name?.toLowerCase().replace(/\s+/g, '') ?? 'player';
  });

  readonly totalGames = computed(() =>
    this.store.friends().reduce((max, f) => Math.max(max, f.games), 0)
  );
  readonly totalWins = computed(() =>
    this.store.friends().reduce((acc, f) => acc + f.wins, 0)
  );
  readonly avgWinRate = computed(() => {
    const items = this.store.friends().filter((f) => f.games > 0);
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, f) => acc + (f.wins / f.games), 0);
    return Math.round((sum / items.length) * 100);
  });
  readonly bestStreak = computed(() => {
    return this.store.friends().reduce((max, f) => Math.max(max, f.wins), 0);
  });
  readonly sortedFriends = computed(() =>
    [...this.store.friends()].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.games - a.games;
    })
  );
  readonly filteredFriends = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.sortedFriends();
    return this.sortedFriends().filter((f) => f.name.toLowerCase().includes(q));
  });
  readonly podium = computed(() => this.sortedFriends().slice(0, 3).filter((f) => f.games > 0));
  readonly discoverable = computed(() => {
    const myFriendEmails = new Set(this.store.friends().map((f) => f.name.toLowerCase()));
    return this.auth.otherAccounts().filter((a) =>
      !myFriendEmails.has(a.displayName.toLowerCase())
    );
  });

  async ngOnInit() {
    await this.auth.load();
    await this.store.load();
    if (!this.store.me()) void this.router.navigate(['/sign-in']);
  }

  rankOf(friendId: string): number | undefined {
    const idx = this.sortedFriends().findIndex((f) => f.id === friendId);
    if (idx < 0) return undefined;
    return idx + 1;
  }

  topFriend() {
    const items = this.sortedFriends();
    return items[0]?.games ? items[0] : null;
  }

  canAdd(): boolean { return this.newName().trim().length >= 1; }

  async add() {
    if (!this.canAdd()) return;
    void this.haptics.medium();
    await this.store.addFriend(this.newName().trim(), this.newColor(), this.newAvatar());
    this.newName.set('');
    this.newColor.set('R');
    this.newAvatar.set('User');
    this.addOpen.set(false);
  }

  async addFromAccount(a: { displayName: string; color: ManaColor; avatar: string }) {
    void this.haptics.success();
    await this.store.addFriend(a.displayName, a.color, a.avatar);
  }

  async remove(id: string) {
    void this.haptics.warning();
    await this.store.removeFriend(id);
  }

  async signOut() {
    void this.haptics.warning();
    await this.auth.logout();
    await this.store.signOut();
    void this.router.navigate(['/sign-in']);
  }

  goTheme() { void this.router.navigate(['/']); }
  back() { void this.router.navigate(['/']); }
}

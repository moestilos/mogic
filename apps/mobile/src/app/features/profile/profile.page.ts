import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LowerCasePipe, NgClass } from '@angular/common';
import type { ManaColor } from '@crown/game-engine';
import { ProfileStore } from '../../core/stores/profile.store';
import { AuthStore } from '../../core/stores/auth.store';
import { FriendRequestsStore } from '../../core/stores/friend-requests.store';
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

        <header class="mb-5 relative z-10 flex items-center justify-between gap-3">
          <button class="profile-icon-btn" (click)="back()" aria-label="Atrás">
            <crown-icon name="ChevronLeft" [size]="18"></crown-icon>
          </button>
          <h1 class="crown-hud">Mi perfil</h1>
          <button class="profile-icon-btn" (click)="signOut()" aria-label="Salir">
            <crown-icon name="LogOut" [size]="16"></crown-icon>
          </button>
        </header>

        @if (auth.me(); as me) {
          <!-- Hero card -->
          <div class="profile-hero relative z-10 mb-5">
            <div class="profile-hero-stripe" [ngClass]="me.color | lowercase"></div>
            <div class="flex items-center gap-4 p-5">
              <div class="profile-avatar">
                <crown-icon [name]="$any(me.avatar)" [size]="40" [strokeWidth]="1.2"></crown-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="crown-display profile-hero-name truncate">{{ me.displayName }}</div>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <div class="profile-handle">&#64;{{ me.username }}</div>
                  <div class="profile-color-chip">
                    <div class="crown-pip" [ngClass]="me.color | lowercase"></div>
                    {{ me.color }}
                  </div>
                </div>
              </div>
              <button class="profile-icon-btn" (click)="openEdit()" aria-label="Editar perfil">
                <crown-icon name="Settings" [size]="16"></crown-icon>
              </button>
            </div>

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
                <div class="profile-hero-stat-num">{{ store.friends().length }}</div>
                <div class="profile-hero-stat-label">Amigos</div>
              </div>
              <div class="profile-hero-stat">
                <div class="profile-hero-stat-num crown-text-danger flex items-center gap-1 justify-center">
                  <crown-icon name="Flame" [size]="18"></crown-icon>{{ bestStreak() }}
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
            <button class="profile-tab" [class.is-on]="tab() === 'requests'" (click)="tab.set('requests')">
              <crown-icon name="UserPlus" [size]="14"></crown-icon> Solicitudes
              @if (requests.incomingPending().length > 0) {
                <span class="profile-tab-badge">{{ requests.incomingPending().length }}</span>
              }
            </button>
            <button class="profile-tab" [class.is-on]="tab() === 'search'" (click)="tab.set('search')">
              <crown-icon name="Search" [size]="14"></crown-icon> Buscar
            </button>
            <button class="profile-tab" [class.is-on]="tab() === 'stats'" (click)="tab.set('stats')">
              <crown-icon name="Trophy" [size]="14"></crown-icon> Stats
            </button>
          </div>

          <!-- FRIENDS TAB -->
          @if (tab() === 'friends') {
            <div class="relative z-10">
              @if (store.friends().length === 0) {
                <div class="profile-empty">
                  <crown-icon name="Users" [size]="44" [strokeWidth]="1.2" cls="crown-text-lo"></crown-icon>
                  <p class="profile-empty-title">Sin amigos todavía</p>
                  <p class="profile-empty-sub">Busca usuarios registrados y envíales una solicitud para añadirlos.</p>
                  <button class="crown-btn-primary mt-4 px-5 py-3 text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
                          (click)="tab.set('search')">
                    <crown-icon name="Search" [size]="14"></crown-icon> Buscar usuarios
                  </button>
                </div>
              } @else {
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  @for (f of sortedFriends(); track f.id; let i = $index) {
                    <div class="relative">
                      <player-card
                        size="md"
                        [data]="{
                          name: f.name,
                          color: f.color,
                          avatar: $any(f.avatar),
                          wins: f.wins,
                          games: f.games,
                          rank: i + 1
                        }"></player-card>
                      <button class="profile-card-del" (click)="remove(f.id)" aria-label="Eliminar amigo">
                        <crown-icon name="Trash2" [size]="12"></crown-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- REQUESTS TAB -->
          @if (tab() === 'requests') {
            <div class="relative z-10 space-y-5">
              <!-- Incoming -->
              <section>
                <div class="crown-hud mb-3 flex items-center gap-1.5">
                  <crown-icon name="UserPlus" [size]="11"></crown-icon>
                  Solicitudes recibidas
                  @if (requests.incomingPending().length > 0) {
                    <span class="crown-text-accent">· {{ requests.incomingPending().length }}</span>
                  }
                </div>
                @if (requests.incomingPending().length === 0) {
                  <div class="profile-empty py-6">
                    <p class="crown-text-lo text-sm">Sin solicitudes pendientes</p>
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (r of requests.incomingPending(); track r.id) {
                      @if (accountInfo(r.fromAccountId); as user) {
                        <div class="profile-request">
                          <div class="profile-suggest-avatar">
                            <crown-icon [name]="$any(user.avatar)" [size]="20"></crown-icon>
                          </div>
                          <div class="crown-pip" [ngClass]="user.color | lowercase"></div>
                          <div class="flex-1 min-w-0">
                            <div class="profile-suggest-name">{{ user.displayName }}</div>
                            <div class="profile-suggest-email">&#64;{{ user.username }}</div>
                          </div>
                          <div class="flex gap-1.5">
                            <button class="crown-btn px-3 py-2 text-[10px] uppercase tracking-widest"
                                    (click)="decline(r.id)">Rechazar</button>
                            <button class="crown-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest flex items-center gap-1"
                                    (click)="accept(r.id)">
                              <crown-icon name="Check" [size]="11"></crown-icon> Aceptar
                            </button>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </section>

              <!-- Outgoing -->
              <section>
                <div class="crown-hud mb-3 flex items-center gap-1.5">
                  <crown-icon name="UserPlus" [size]="11" style="transform: rotate(180deg);"></crown-icon>
                  Solicitudes enviadas
                </div>
                @if (requests.outgoingPending().length === 0) {
                  <div class="profile-empty py-6">
                    <p class="crown-text-lo text-sm">No tienes solicitudes pendientes de envío</p>
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (r of requests.outgoingPending(); track r.id) {
                      @if (accountInfo(r.toAccountId); as user) {
                        <div class="profile-request">
                          <div class="profile-suggest-avatar">
                            <crown-icon [name]="$any(user.avatar)" [size]="20"></crown-icon>
                          </div>
                          <div class="crown-pip" [ngClass]="user.color | lowercase"></div>
                          <div class="flex-1 min-w-0">
                            <div class="profile-suggest-name">{{ user.displayName }}</div>
                            <div class="profile-suggest-email">&#64;{{ user.username }} · pendiente</div>
                          </div>
                          <button class="crown-btn-ghost text-[10px] uppercase tracking-widest"
                                  (click)="cancel(r.id)">Cancelar</button>
                        </div>
                      }
                    }
                  </div>
                }
              </section>
            </div>
          }

          <!-- SEARCH TAB -->
          @if (tab() === 'search') {
            <div class="relative z-10">
              <div class="profile-search mb-4">
                <crown-icon name="Search" [size]="15" cls="crown-text-lo"></crown-icon>
                <input class="profile-search-input"
                       [value]="searchQuery()"
                       (input)="searchQuery.set($any($event.target).value)"
                       placeholder="Busca por nombre, &#64;usuario o email..."
                       autocapitalize="off" />
                @if (searchQuery().length > 0) {
                  <button class="crown-btn-ghost" (click)="searchQuery.set('')" aria-label="Limpiar">
                    <crown-icon name="X" [size]="13"></crown-icon>
                  </button>
                }
              </div>

              @if (searchResults().length === 0 && searchQuery().length > 0) {
                <div class="profile-empty">
                  <crown-icon name="Search" [size]="36" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
                  <p class="profile-empty-title">Sin resultados</p>
                  <p class="profile-empty-sub">No hay usuarios registrados que coincidan con "{{ searchQuery() }}"</p>
                </div>
              }

              @if (searchResults().length === 0 && searchQuery().length === 0) {
                <div class="profile-empty">
                  <crown-icon name="Users" [size]="40" [strokeWidth]="1.25" cls="crown-text-lo"></crown-icon>
                  <p class="profile-empty-title">Encuentra jugadores</p>
                  <p class="profile-empty-sub">Escribe un nombre, usuario o email para buscar entre los registrados.</p>
                </div>
              }

              <div class="space-y-2">
                @for (u of searchResults(); track u.id) {
                  <div class="profile-request">
                    <div class="profile-suggest-avatar">
                      <crown-icon [name]="$any(u.avatar)" [size]="20"></crown-icon>
                    </div>
                    <div class="crown-pip" [ngClass]="u.color | lowercase"></div>
                    <div class="flex-1 min-w-0">
                      <div class="profile-suggest-name">{{ u.displayName }}</div>
                      <div class="profile-suggest-email">&#64;{{ u.username }}</div>
                    </div>
                    @switch (relationFor(u.id)) {
                      @case ('friends') {
                        <div class="profile-status profile-status--ok">
                          <crown-icon name="Check" [size]="11"></crown-icon> Amigo
                        </div>
                      }
                      @case ('sent') {
                        <div class="profile-status profile-status--pending">Pendiente</div>
                      }
                      @case ('received') {
                        <button class="crown-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest"
                                (click)="acceptByUser(u.id)">Aceptar</button>
                      }
                      @default {
                        <button class="crown-btn-primary px-3 py-2 text-[10px] uppercase tracking-widest flex items-center gap-1"
                                (click)="sendRequest(u.id)">
                          <crown-icon name="UserPlus" [size]="11"></crown-icon> Solicitar
                        </button>
                      }
                    }
                  </div>
                }
              </div>

              @if (errorMsg()) {
                <div class="profile-error mt-3">
                  <crown-icon name="X" [size]="13"></crown-icon> {{ errorMsg() }}
                </div>
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
            </div>
          }
        }
      </div>

      <!-- EDIT PROFILE MODAL -->
      @if (editOpen()) {
        <div class="fixed inset-0 z-[70] flex items-end md:items-center justify-center" (click)="closeEdit()">
          <div class="edit-backdrop"></div>
          <div class="edit-modal" (click)="$event.stopPropagation()">

            <div class="edit-header">
              <div>
                <div class="edit-eyebrow">Editar perfil</div>
                <div class="edit-title">Tu cuenta</div>
              </div>
              <button class="edit-icon-btn" (click)="closeEdit()" aria-label="Cerrar">
                <crown-icon name="X" [size]="18"></crown-icon>
              </button>
            </div>

            <!-- Tabs edit -->
            <div class="edit-tabs">
              <button class="edit-tab" [class.is-on]="editTab() === 'identity'" (click)="editTab.set('identity')">Identidad</button>
              <button class="edit-tab" [class.is-on]="editTab() === 'account'" (click)="editTab.set('account')">Cuenta</button>
              <button class="edit-tab" [class.is-on]="editTab() === 'password'" (click)="editTab.set('password')">Contraseña</button>
            </div>

            @if (editTab() === 'identity') {
              <div class="edit-section">
                <label class="edit-label">Nombre visible</label>
                <input class="edit-input" [value]="editName()" (input)="editName.set($any($event.target).value)" maxlength="20" />

                <label class="edit-label">Color principal</label>
                <div class="flex gap-1.5 flex-wrap mb-3">
                  @for (c of colors; track c) {
                    <button class="crown-color-swatch"
                            [ngClass]="(c | lowercase)"
                            [class.is-on]="editColor() === c"
                            (click)="editColor.set(c)"
                            [attr.aria-label]="c"></button>
                  }
                </div>

                <label class="edit-label">Avatar</label>
                <div class="grid grid-cols-6 gap-1.5 max-h-[32vh] overflow-y-auto pr-1 mb-2">
                  @for (a of avatars; track a) {
                    <button class="aspect-square flex items-center justify-center edit-avatar-btn"
                            [class.is-on]="editAvatar() === a"
                            (click)="editAvatar.set(a)">
                      <crown-icon [name]="$any(a)" [size]="18"></crown-icon>
                    </button>
                  }
                </div>
              </div>
              <button class="edit-cta" (click)="saveIdentity()">
                <crown-icon name="Check" [size]="14"></crown-icon> Guardar identidad
              </button>
            }

            @if (editTab() === 'account') {
              <div class="edit-section">
                <label class="edit-label">Usuario (&#64;)</label>
                <input class="edit-input" [value]="editUsername()" (input)="editUsername.set($any($event.target).value)" maxlength="24" placeholder="solo_letras_numeros" autocapitalize="off" />
                <p class="edit-hint">Solo letras minúsculas, números y guión bajo</p>

                <label class="edit-label">Email</label>
                <input class="edit-input" [value]="editEmail()" (input)="editEmail.set($any($event.target).value)" type="email" autocomplete="email" inputmode="email" />

                <label class="edit-label">Contraseña actual (requerida para email)</label>
                <input class="edit-input" [value]="editEmailPass()" (input)="editEmailPass.set($any($event.target).value)" type="password" autocomplete="current-password" />
              </div>
              <button class="edit-cta" (click)="saveAccount()">
                <crown-icon name="Check" [size]="14"></crown-icon> Guardar cuenta
              </button>
            }

            @if (editTab() === 'password') {
              <div class="edit-section">
                <label class="edit-label">Contraseña actual</label>
                <input class="edit-input" [value]="pwCurrent()" (input)="pwCurrent.set($any($event.target).value)" type="password" autocomplete="current-password" />

                <label class="edit-label">Contraseña nueva</label>
                <input class="edit-input" [value]="pwNew()" (input)="pwNew.set($any($event.target).value)" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" />

                <label class="edit-label">Confirmar nueva</label>
                <input class="edit-input" [value]="pwConfirm()" (input)="pwConfirm.set($any($event.target).value)" type="password" autocomplete="new-password" />
              </div>
              <button class="edit-cta" (click)="savePassword()">
                <crown-icon name="Lock" [size]="14"></crown-icon> Cambiar contraseña
              </button>
            }

            @if (editError()) {
              <div class="edit-error">
                <crown-icon name="X" [size]="13"></crown-icon> {{ editError() }}
              </div>
            }
            @if (editSuccess()) {
              <div class="edit-success">
                <crown-icon name="Check" [size]="13"></crown-icon> {{ editSuccess() }}
              </div>
            }
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
    [data-theme='chrome'] .profile-avatar { background: linear-gradient(135deg, rgba(255,158,208,0.1), rgba(179,157,255,0.1), rgba(157,210,255,0.08)); border-color: rgba(179,157,255,0.3); }
    [data-theme='sigil']  .profile-avatar { background: rgba(201,162,86,0.08); border-color: rgba(201,162,86,0.4); color: var(--accent-flat); }

    .profile-hero-name { font-size: clamp(28px, 6vw, 38px); letter-spacing: -0.03em; line-height: 1.05; }
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

    .profile-hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--divider); }
    .profile-hero-stat { padding: 12px 8px; text-align: center; border-right: 1px solid var(--divider); }
    .profile-hero-stat:last-child { border-right: none; }
    .profile-hero-stat-num {
      font-family: var(--font-life); font-weight: var(--life-weight);
      font-size: 24px; letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums; color: var(--text-hi); line-height: 1;
    }
    .profile-hero-stat-label {
      font-family: var(--font-hud); font-size: 9px;
      letter-spacing: 0.22em; text-transform: uppercase;
      color: var(--text-lo); margin-top: 5px;
    }

    .profile-tabs {
      display: flex; gap: 6px; padding: 4px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: 12px;
      overflow-x: auto;
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
      white-space: nowrap;
      transition: background 180ms ease, color 180ms ease;
    }
    [data-theme='brutal'] .profile-tab { border-radius: 0; border-right: 1.5px solid var(--text-hi); }
    [data-theme='brutal'] .profile-tab:last-child { border-right: none; }
    .profile-tab:hover { color: var(--text-mid); }
    .profile-tab.is-on { background: var(--accent); color: var(--accent-text); }
    [data-theme='chrome'] .profile-tab.is-on { background-size: 300% 100%; animation: chromeFlow 5s linear infinite; }
    .profile-tab-count {
      background: rgba(255,255,255,0.15);
      padding: 1px 6px;
      border-radius: 99px;
      font-size: 9px;
    }
    .profile-tab.is-on .profile-tab-count { background: rgba(0,0,0,0.18); }
    .profile-tab-badge {
      background: var(--danger);
      color: #fff;
      padding: 1px 6px;
      border-radius: 99px;
      font-size: 9px;
    }

    .profile-search {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 14px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--input-radius);
    }
    .profile-search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text-hi); font-family: var(--font-name); font-size: 14px;
    }
    .profile-search-input::placeholder { color: var(--text-lo); }

    .profile-empty {
      text-align: center; padding: 32px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='brutal'] .profile-empty { border-radius: 0; border-style: solid; border-width: 1.5px; }
    .profile-empty-title {
      font-family: var(--font-display); font-weight: var(--life-weight);
      font-size: 17px; color: var(--text-mid); margin-top: 12px;
    }
    .profile-empty-sub { font-size: 12px; color: var(--text-lo); margin-top: 4px; line-height: 1.45; }

    .profile-request {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark'] .profile-request { background: rgba(20,20,14,0.03); }
    .profile-suggest-avatar {
      width: 36px; height: 36px; background: var(--bg-input);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: var(--text-hi); flex-shrink: 0;
    }
    [data-theme='brutal'] .profile-suggest-avatar { border-radius: 0; }
    .profile-suggest-name {
      font-family: var(--font-name); font-weight: 600; font-size: 14px;
      color: var(--text-hi);
    }
    .profile-suggest-email {
      font-family: var(--font-hud); font-size: 10px;
      letter-spacing: 0.04em; color: var(--text-lo); margin-top: 2px;
    }

    .profile-status {
      font-family: var(--font-hud); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase;
      padding: 6px 10px; border-radius: 99px;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .profile-status--ok { color: var(--success); border: 1px solid var(--success); background: rgba(157,255,179,0.06); }
    .profile-status--pending { color: var(--warn); border: 1px solid var(--warn); background: rgba(255,213,106,0.06); }

    .profile-error {
      display: flex; align-items: center; gap: 6px;
      color: var(--danger);
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      padding: 10px 14px;
      border-radius: var(--input-radius);
      font-size: 13px;
    }

    .profile-card-del {
      position: absolute; top: 6px; left: 6px; z-index: 10;
      width: 26px; height: 26px;
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 99px;
      color: #e8e8f0;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 160ms ease;
    }
    .profile-card-del:hover { background: var(--danger); }

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
      font-family: var(--font-life); font-weight: var(--life-weight);
      font-size: 28px; letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums; color: var(--text-hi); line-height: 1;
    }
    .profile-stat-label {
      font-family: var(--font-hud); font-size: 9px;
      letter-spacing: 0.22em; text-transform: uppercase;
      color: var(--text-lo); margin-top: 5px;
    }

    /* Edit profile modal — adopta theme tokens */
    .edit-backdrop {
      position: fixed; inset: 0;
      background: var(--modal-backdrop);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
    }
    .edit-modal {
      position: relative; z-index: 1;
      width: 100%; max-width: 32rem; max-height: 92vh;
      overflow-y: auto;
      padding: 22px;
      background: var(--bg-elevated);
      border: 1px solid var(--divider);
      border-radius: var(--modal-radius) var(--modal-radius) 0 0;
      color: var(--text-hi);
      margin: 0 auto;
    }
    @media (min-width: 768px) {
      .edit-modal { border-radius: var(--modal-radius); margin-bottom: 2rem; }
    }
    [data-theme='vapor'] .edit-modal { backdrop-filter: blur(24px); }
    [data-theme='brutal'] .edit-modal { border-width: 1.5px; }
    [data-theme='sigil'] .edit-modal { border-color: rgba(201,162,86,0.25); }

    .edit-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .edit-eyebrow {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: var(--hud-letter);
      text-transform: uppercase;
      color: var(--hud-color);
    }
    [data-theme='sigil'] .edit-eyebrow { text-transform: lowercase; font-style: italic; }
    .edit-title {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: 24px;
      letter-spacing: -0.02em;
      color: var(--text-hi);
      margin-top: 4px;
    }
    .edit-icon-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--btn-radius);
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease;
    }
    .edit-icon-btn:hover { background: rgba(255,255,255,0.1); }
    [data-theme='stark'] .edit-icon-btn:hover { background: rgba(20,20,14,0.08); }

    .edit-tabs {
      display: flex; gap: 4px; padding: 4px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--btn-radius);
      margin-bottom: 16px;
    }
    [data-theme='brutal'] .edit-tabs { padding: 0; gap: 0; border-radius: 0; }
    .edit-tab {
      flex: 1; padding: 10px 6px;
      background: transparent;
      border: none;
      color: var(--text-lo);
      font-family: var(--font-btn);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border-radius: calc(var(--btn-radius) - 2px);
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease;
    }
    [data-theme='brutal'] .edit-tab { border-radius: 0; border-right: 1.5px solid var(--text-hi); }
    [data-theme='brutal'] .edit-tab:last-child { border-right: none; }
    [data-theme='sigil'] .edit-tab { font-style: italic; letter-spacing: 0.2em; text-transform: none; }
    .edit-tab:hover { color: var(--text-mid); }
    .edit-tab.is-on {
      background: var(--accent);
      color: var(--accent-text);
    }
    [data-theme='chrome'] .edit-tab.is-on {
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    [data-theme='sigil'] .edit-tab.is-on { background: transparent; color: var(--accent-flat); }

    .edit-section { margin-bottom: 14px; }
    .edit-label {
      display: block;
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: var(--hud-letter);
      text-transform: uppercase;
      color: var(--hud-color);
      margin-top: 12px;
      margin-bottom: 6px;
    }
    [data-theme='sigil'] .edit-label { text-transform: lowercase; font-style: italic; }
    .edit-input {
      width: 100%;
      padding: 11px 14px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--input-radius);
      color: var(--text-hi);
      font-family: var(--font-body);
      font-size: 14px;
      outline: none;
      transition: border-color 160ms ease;
    }
    .edit-input:focus { border-color: var(--accent-flat); }
    .edit-input::placeholder { color: var(--text-lo); }
    [data-theme='brutal'] .edit-input { border-width: 1.5px; }
    [data-theme='sigil'] .edit-input {
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--bg-pod-border);
      border-radius: 0;
      font-style: italic;
      font-size: 16px;
    }

    .edit-hint {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--text-lo);
      margin-top: 4px;
      margin-bottom: 4px;
    }
    .edit-avatar-btn {
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: calc(var(--btn-radius) - 2px);
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
    }
    [data-theme='brutal'] .edit-avatar-btn { border-radius: 0; border-width: 1.5px; }
    .edit-avatar-btn:hover { background: rgba(255,255,255,0.08); }
    [data-theme='stark'] .edit-avatar-btn:hover { background: rgba(20,20,14,0.06); }
    .edit-avatar-btn.is-on {
      background: var(--accent);
      border-color: transparent;
      color: var(--accent-text);
    }
    [data-theme='chrome'] .edit-avatar-btn.is-on {
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    [data-theme='sigil'] .edit-avatar-btn.is-on {
      background: transparent;
      border-color: var(--accent-flat);
      color: var(--accent-flat);
    }

    .edit-cta {
      width: 100%;
      padding: 14px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--accent);
      color: var(--accent-text);
      border: none;
      border-radius: var(--btn-radius);
      font-family: var(--font-btn);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 100ms ease;
    }
    [data-theme='chrome'] .edit-cta {
      background-size: 300% 100%;
      animation: chromeFlow 5s linear infinite;
    }
    [data-theme='sigil'] .edit-cta {
      background: transparent;
      color: var(--accent-flat);
      border: 1px solid var(--accent-flat);
      font-style: italic;
      letter-spacing: 0.22em;
      text-transform: none;
    }
    [data-theme='stark'] .edit-cta { font-style: italic; }
    .edit-cta:active { transform: scale(0.98); }

    .edit-error {
      display: flex; align-items: center; gap: 6px;
      margin-top: 12px;
      padding: 10px 14px;
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      border-radius: var(--input-radius);
      color: var(--danger);
      font-size: 13px;
      font-family: var(--font-body);
    }
    .edit-success {
      display: flex; align-items: center; gap: 6px;
      margin-top: 12px;
      padding: 10px 14px;
      background: rgba(157,255,179,0.1);
      border: 1px solid var(--success);
      border-radius: var(--input-radius);
      color: var(--success);
      font-size: 13px;
      font-family: var(--font-body);
    }
    [data-theme='stark'] .edit-success { background: rgba(74,122,58,0.08); }
  `],
})
export class ProfilePage implements OnInit {
  readonly store = inject(ProfileStore);
  readonly auth = inject(AuthStore);
  readonly requests = inject(FriendRequestsStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'friends' | 'requests' | 'search' | 'stats'>('friends');
  readonly searchQuery = signal('');
  readonly errorMsg = signal<string | null>(null);

  // Edit profile modal state
  readonly colors = COLORS;
  readonly avatars = AVATAR_ICONS;
  readonly editOpen = signal(false);
  readonly editTab = signal<'identity' | 'account' | 'password'>('identity');
  readonly editName = signal('');
  readonly editColor = signal<ManaColor>('U');
  readonly editAvatar = signal<IconKey>('Crown');
  readonly editUsername = signal('');
  readonly editEmail = signal('');
  readonly editEmailPass = signal('');
  readonly pwCurrent = signal('');
  readonly pwNew = signal('');
  readonly pwConfirm = signal('');
  readonly editError = signal<string | null>(null);
  readonly editSuccess = signal<string | null>(null);

  readonly totalGames = computed(() =>
    this.store.friends().reduce((max, f) => Math.max(max, f.games), 0)
  );
  readonly totalWins = computed(() =>
    this.store.friends().reduce((acc, f) => acc + f.wins, 0)
  );
  readonly bestStreak = computed(() =>
    this.store.friends().reduce((max, f) => Math.max(max, f.wins), 0)
  );
  readonly sortedFriends = computed(() =>
    [...this.store.friends()].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.games - a.games;
    })
  );
  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q.length < 1) return [];
    return this.auth.otherAccounts().filter((a) =>
      a.displayName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  async ngOnInit() {
    await this.auth.load();
    const me = this.auth.me();
    await this.store.setScope(me?.id ?? null);
    await this.store.load();
    await this.requests.load();
    if (!me) void this.router.navigate(['/sign-in']);
  }

  accountInfo(id: string) { return this.auth.accountById(id); }
  relationFor(id: string) { return this.requests.hasRelation(id); }

  async sendRequest(targetId: string) {
    this.errorMsg.set(null);
    void this.haptics.medium();
    const { error } = await this.requests.sendRequest(targetId);
    if (error) { this.errorMsg.set(error); void this.haptics.error(); return; }
    void this.haptics.success();
  }

  async accept(reqId: string) {
    void this.haptics.success();
    await this.requests.acceptRequest(reqId);
  }
  async acceptByUser(userId: string) {
    const r = this.requests.incomingPending().find((req) => req.fromAccountId === userId);
    if (r) await this.accept(r.id);
  }
  async decline(reqId: string) {
    void this.haptics.warning();
    await this.requests.declineRequest(reqId);
  }
  async cancel(reqId: string) {
    void this.haptics.warning();
    await this.requests.cancelRequest(reqId);
  }

  topFriend() {
    const items = this.sortedFriends();
    return items[0]?.games ? items[0] : null;
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

  back() { void this.router.navigate(['/']); }

  // ── Edit profile ────────────────────────────────────────
  openEdit() {
    void this.haptics.medium();
    const me = this.auth.me();
    if (!me) return;
    this.editName.set(me.displayName);
    this.editColor.set(me.color);
    this.editAvatar.set(me.avatar as IconKey);
    this.editUsername.set(me.username);
    this.editEmail.set(me.email);
    this.editEmailPass.set('');
    this.pwCurrent.set('');
    this.pwNew.set('');
    this.pwConfirm.set('');
    this.editError.set(null);
    this.editSuccess.set(null);
    this.editTab.set('identity');
    this.editOpen.set(true);
  }

  closeEdit() {
    this.editOpen.set(false);
  }

  private clearMessages() {
    this.editError.set(null);
    this.editSuccess.set(null);
  }

  async saveIdentity() {
    this.clearMessages();
    const me = this.auth.me();
    if (!me) return;
    const name = this.editName().trim();
    if (name.length < 2) { this.editError.set('Nombre mínimo 2 caracteres'); void this.haptics.error(); return; }
    await this.auth.updateProfile({
      displayName: name,
      color: this.editColor(),
      avatar: this.editAvatar(),
    });
    // Mirror al ProfileStore para consistencia
    await this.store.updateProfile({ name, color: this.editColor(), avatar: this.editAvatar() });
    void this.haptics.success();
    this.editSuccess.set('Identidad actualizada');
  }

  async saveAccount() {
    this.clearMessages();
    const me = this.auth.me();
    if (!me) return;
    const newUsername = this.editUsername().trim();
    const newEmail = this.editEmail().trim();
    let changedAny = false;

    if (newUsername !== me.username) {
      const { error } = await this.auth.changeUsername(newUsername);
      if (error) { this.editError.set(error); void this.haptics.error(); return; }
      changedAny = true;
    }
    if (newEmail !== me.email) {
      if (this.editEmailPass().length < 1) {
        this.editError.set('Necesitas tu contraseña actual para cambiar el email');
        void this.haptics.error();
        return;
      }
      const { error } = await this.auth.changeEmail(newEmail, this.editEmailPass());
      if (error) { this.editError.set(error); void this.haptics.error(); return; }
      changedAny = true;
      this.editEmailPass.set('');
    }
    if (!changedAny) {
      this.editError.set('No has cambiado nada');
      return;
    }
    void this.haptics.success();
    this.editSuccess.set('Cuenta actualizada');
  }

  async savePassword() {
    this.clearMessages();
    const cur = this.pwCurrent();
    const nw = this.pwNew();
    const cf = this.pwConfirm();
    if (cur.length < 1) { this.editError.set('Introduce tu contraseña actual'); void this.haptics.error(); return; }
    if (nw.length < 6) { this.editError.set('Nueva contraseña mínimo 6 caracteres'); void this.haptics.error(); return; }
    if (nw !== cf) { this.editError.set('Las contraseñas nuevas no coinciden'); void this.haptics.error(); return; }
    const { error } = await this.auth.changePassword(cur, nw);
    if (error) { this.editError.set(error); void this.haptics.error(); return; }
    this.pwCurrent.set('');
    this.pwNew.set('');
    this.pwConfirm.set('');
    void this.haptics.success();
    this.editSuccess.set('Contraseña actualizada');
  }
}

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
      <div class="min-h-screen px-4 md:px-12 lg:px-24 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] max-w-4xl mx-auto relative"
           style="background: var(--bg-base);">
        <app-animated-background></app-animated-background>

        <header class="mb-4 relative z-10 flex items-center justify-between gap-2">
          <button class="profile-icon-btn" (click)="back()" aria-label="Atrás">
            <crown-icon name="ChevronLeft" [size]="18"></crown-icon>
          </button>
          <h1 class="crown-hud">Mi perfil</h1>
          <button class="profile-icon-btn" (click)="signOut()" aria-label="Salir">
            <crown-icon name="LogOut" [size]="16"></crown-icon>
          </button>
        </header>

        @if (auth.me(); as me) {
          <!-- ID Card -->
          <div class="id-card relative z-10 mb-5" [attr.data-color]="(me.color | lowercase)">
            <div class="id-card-stripe" [ngClass]="me.color | lowercase"></div>

            <div class="id-card-top">
              <div class="id-card-eyebrow">
                <crown-icon name="Sparkles" [size]="10"></crown-icon> Mogic · ID
              </div>
              <button class="id-card-edit" (click)="openEdit()" aria-label="Editar perfil">
                <crown-icon name="Settings" [size]="14"></crown-icon>
              </button>
            </div>

            <div class="id-card-body">
              <div class="id-avatar-halo" [ngClass]="me.color | lowercase">
                <div class="id-avatar">
                  <crown-icon [name]="$any(me.avatar)" [size]="42" [strokeWidth]="1.15"></crown-icon>
                </div>
              </div>

              <div class="id-card-name">{{ me.displayName }}</div>

              <div class="id-card-meta">
                <span class="id-handle">&#64;{{ me.username }}</span>
                <span class="id-dot"></span>
                <span class="id-color-chip">
                  <span class="crown-pip" [ngClass]="me.color | lowercase"></span>
                  {{ me.color }}
                </span>
              </div>
            </div>

            <div class="id-card-perforation" aria-hidden="true">
              @for (_ of perforations; track $index) { <span></span> }
            </div>

            <div class="id-card-stats">
              <div class="id-stat">
                <div class="id-stat-num crown-text-accent">{{ totalWins() }}</div>
                <div class="id-stat-label">Wins</div>
              </div>
              <div class="id-stat">
                <div class="id-stat-num">{{ totalGames() }}</div>
                <div class="id-stat-label">Partidas</div>
              </div>
              <div class="id-stat">
                <div class="id-stat-num">{{ store.friends().length }}</div>
                <div class="id-stat-label">Amigos</div>
              </div>
              <div class="id-stat">
                <div class="id-stat-num crown-text-danger flex items-center gap-1 justify-center">
                  <crown-icon name="Flame" [size]="16"></crown-icon>{{ bestStreak() }}
                </div>
                <div class="id-stat-label">Best</div>
              </div>
            </div>
          </div>

          <!-- Tabs (sticky) -->
          <div class="profile-tabs-wrap relative z-20 mb-5">
            <div class="profile-tabs">
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
                <div class="profile-toolbar mb-3">
                  <div class="profile-sort">
                    <button class="profile-sort-chip" [class.is-on]="friendSort() === 'wins'"   (click)="friendSort.set('wins')">
                      <crown-icon name="Trophy" [size]="11"></crown-icon> Wins
                    </button>
                    <button class="profile-sort-chip" [class.is-on]="friendSort() === 'games'"  (click)="friendSort.set('games')">
                      <crown-icon name="Dices" [size]="11"></crown-icon> Partidas
                    </button>
                    <button class="profile-sort-chip" [class.is-on]="friendSort() === 'name'"   (click)="friendSort.set('name')">
                      <crown-icon name="Sparkles" [size]="11"></crown-icon> A-Z
                    </button>
                  </div>
                  <button class="profile-sort-add" (click)="tab.set('search')" aria-label="Añadir amigo">
                    <crown-icon name="UserPlus" [size]="14"></crown-icon>
                  </button>
                </div>
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
                       (input)="onSearchChange($any($event.target).value)"
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
            <div class="relative z-10 space-y-5">
              <!-- Headline metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Trophy" [size]="16" cls="crown-text-accent"></crown-icon></div>
                  <div class="profile-stat-num crown-text-accent">{{ winratePct() }}<span class="profile-stat-suffix">%</span></div>
                  <div class="profile-stat-label">Winrate</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Dices" [size]="16" cls="crown-text-mid"></crown-icon></div>
                  <div class="profile-stat-num">{{ totalGames() }}</div>
                  <div class="profile-stat-label">Partidas</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Users" [size]="16" cls="crown-text-mid"></crown-icon></div>
                  <div class="profile-stat-num">{{ store.friends().length }}</div>
                  <div class="profile-stat-label">Amigos</div>
                </div>
                <div class="profile-stat-card">
                  <div class="profile-stat-icon"><crown-icon name="Flame" [size]="16" cls="crown-text-danger"></crown-icon></div>
                  <div class="profile-stat-num">{{ bestStreak() }}</div>
                  <div class="profile-stat-label">Best</div>
                </div>
              </div>

              <!-- King of the table -->
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

              <!-- Color distribution -->
              @if (store.friends().length > 0) {
                <div>
                  <div class="crown-hud mb-2.5 flex items-center gap-1.5">
                    <crown-icon name="Sparkles" [size]="11"></crown-icon> Distribución por color
                  </div>
                  <div class="profile-color-dist">
                    @for (c of colorDistribution(); track c.color) {
                      <div class="profile-color-row">
                        <div class="crown-pip" [ngClass]="c.color | lowercase"></div>
                        <div class="profile-color-key">{{ c.color }}</div>
                        <div class="profile-color-bar-track">
                          <div class="profile-color-bar-fill" [ngClass]="c.color | lowercase" [style.width.%]="c.pct"></div>
                        </div>
                        <div class="profile-color-num">{{ c.count }}</div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Identity summary -->
              @if (auth.me(); as me) {
                <div>
                  <div class="crown-hud mb-2.5 flex items-center gap-1.5">
                    <crown-icon name="Settings" [size]="11"></crown-icon> Cuenta
                  </div>
                  <div class="profile-meta-card">
                    <div class="profile-meta-row">
                      <span class="profile-meta-key">Email</span>
                      <span class="profile-meta-val truncate">{{ me.email }}</span>
                    </div>
                    <div class="profile-meta-row">
                      <span class="profile-meta-key">Usuario</span>
                      <span class="profile-meta-val">&#64;{{ me.username }}</span>
                    </div>
                    <div class="profile-meta-row">
                      <span class="profile-meta-key">Color</span>
                      <span class="profile-meta-val flex items-center gap-1.5">
                        <span class="crown-pip" [ngClass]="me.color | lowercase"></span> {{ me.color }}
                      </span>
                    </div>
                  </div>
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
              <!-- Live preview -->
              <div class="edit-preview">
                <div class="edit-preview-halo" [ngClass]="(editColor() | lowercase)">
                  <div class="edit-preview-avatar">
                    <crown-icon [name]="$any(editAvatar())" [size]="36" [strokeWidth]="1.2"></crown-icon>
                  </div>
                </div>
                <div class="edit-preview-name">{{ editName() || 'Tu nombre' }}</div>
                <div class="edit-preview-color">{{ editColor() }}</div>
              </div>

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

    /* ─── ID Card ──────────────────────────────────────── */
    .id-card {
      position: relative;
      max-width: 26rem;
      margin: 0 auto;
      background: var(--bg-pod);
      border: 1px solid var(--bg-pod-border);
      border-radius: 22px;
      overflow: hidden;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.04) inset,
        0 18px 50px -25px rgba(0,0,0,0.65);
    }
    [data-theme='stark'] .id-card { background: rgba(20,20,14,0.04); border-color: var(--divider); box-shadow: 0 18px 50px -30px rgba(20,20,14,0.25); }
    [data-theme='brutal'] .id-card { border-radius: 0; border-width: 2px; box-shadow: 6px 6px 0 0 var(--text-hi); }
    [data-theme='sigil']  .id-card { border-color: rgba(201,162,86,0.3); }
    [data-theme='chrome'] .id-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,158,208,0.05), rgba(179,157,255,0.04), rgba(157,210,255,0.03));
      pointer-events: none;
    }

    .id-card-stripe {
      position: absolute; top: 0; left: 0; right: 0;
      height: 5px;
    }
    [data-theme='brutal'] .id-card-stripe { height: 8px; }
    .id-card-stripe.w { background: linear-gradient(90deg, #FFFDE0, #F8E9B4); }
    .id-card-stripe.u { background: linear-gradient(90deg, #B7DDF8, #4F8FCB); }
    .id-card-stripe.b { background: linear-gradient(90deg, #4d4253, #1a1620); }
    .id-card-stripe.r { background: linear-gradient(90deg, #F8B7B0, #D24F45); }
    .id-card-stripe.g { background: linear-gradient(90deg, #BFE6A6, #5A9A4C); }
    .id-card-stripe.c { background: linear-gradient(90deg, #d8d8e0, #8b8b9e); }

    .id-card-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 18px 0;
    }
    .id-card-eyebrow {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--hud-color);
    }
    [data-theme='sigil'] .id-card-eyebrow { text-transform: lowercase; font-style: italic; letter-spacing: 0.18em; }
    .id-card-edit {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--divider);
      border-radius: 9px;
      color: var(--text-mid);
      cursor: pointer;
      transition: background 160ms ease, transform 120ms ease;
    }
    .id-card-edit:hover { background: rgba(255,255,255,0.1); }
    .id-card-edit:active { transform: scale(0.92); }
    [data-theme='brutal'] .id-card-edit { border-radius: 0; border-width: 1.5px; }
    [data-theme='stark']  .id-card-edit { background: rgba(20,20,14,0.04); }

    .id-card-body {
      padding: 18px 22px 22px;
      display: flex; flex-direction: column; align-items: center;
      text-align: center;
      position: relative;
    }

    .id-avatar-halo {
      position: relative;
      width: 116px; height: 116px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
      background: radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 70%);
    }
    .id-avatar-halo::before {
      content: ''; position: absolute; inset: -3px;
      border-radius: 50%;
      padding: 2px;
      background: conic-gradient(from 180deg, var(--halo-from), var(--halo-to), var(--halo-from));
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0.85;
    }
    .id-avatar-halo.w { --halo-from: #FFFDE0; --halo-to: #F8E9B4; }
    .id-avatar-halo.u { --halo-from: #B7DDF8; --halo-to: #4F8FCB; }
    .id-avatar-halo.b { --halo-from: #6e5b78; --halo-to: #1a1620; }
    .id-avatar-halo.r { --halo-from: #F8B7B0; --halo-to: #D24F45; }
    .id-avatar-halo.g { --halo-from: #BFE6A6; --halo-to: #5A9A4C; }
    .id-avatar-halo.c { --halo-from: #d8d8e0; --halo-to: #8b8b9e; }
    [data-theme='brutal'] .id-avatar-halo {
      border-radius: 0;
      width: 108px; height: 108px;
    }
    [data-theme='brutal'] .id-avatar-halo::before {
      border-radius: 0;
      background: var(--text-hi);
      opacity: 1;
    }

    .id-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-elevated, rgba(255,255,255,0.03));
      color: var(--text-hi);
    }
    [data-theme='brutal'] .id-avatar { border-radius: 0; }
    [data-theme='sigil']  .id-avatar { color: var(--accent-flat); background: rgba(201,162,86,0.06); }

    .id-card-name {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: clamp(26px, 7vw, 36px);
      letter-spacing: -0.025em;
      line-height: 1.05;
      color: var(--text-hi);
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    [data-theme='brutal'] .id-card-name { text-transform: uppercase; letter-spacing: -0.01em; }
    [data-theme='sigil']  .id-card-name { font-style: italic; }

    .id-card-meta {
      display: inline-flex; align-items: center; gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .id-handle {
      font-family: var(--font-hud);
      font-size: 11px;
      letter-spacing: 0.06em;
      color: var(--text-lo);
    }
    .id-dot {
      width: 3px; height: 3px; border-radius: 50%;
      background: var(--text-lo); opacity: 0.5;
    }
    .id-color-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-mid);
      padding: 3px 9px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--divider);
      border-radius: 99px;
    }
    [data-theme='brutal'] .id-color-chip { border-radius: 0; border-width: 1.5px; }

    /* perforation row */
    .id-card-perforation {
      display: flex; justify-content: space-between;
      padding: 0 14px;
      position: relative;
    }
    .id-card-perforation::before,
    .id-card-perforation::after {
      content: ''; position: absolute; top: 50%;
      width: 14px; height: 14px;
      background: var(--bg-base);
      border-radius: 50%;
      transform: translateY(-50%);
    }
    .id-card-perforation::before { left: -7px; }
    .id-card-perforation::after  { right: -7px; }
    .id-card-perforation span {
      width: 4px; height: 1px;
      background: var(--divider);
      align-self: center;
    }
    [data-theme='brutal'] .id-card-perforation::before,
    [data-theme='brutal'] .id-card-perforation::after { border-radius: 0; }
    [data-theme='brutal'] .id-card-perforation span { background: var(--text-hi); height: 2px; width: 6px; }

    .id-card-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      padding: 14px 8px 18px;
    }
    .id-stat {
      text-align: center;
      padding: 4px 2px;
      border-right: 1px solid var(--divider);
    }
    .id-stat:last-child { border-right: none; }
    [data-theme='brutal'] .id-stat { border-right-width: 1.5px; }
    .id-stat-num {
      font-family: var(--font-life); font-weight: var(--life-weight);
      font-size: 22px; letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      color: var(--text-hi); line-height: 1;
    }
    @media (min-width: 480px) { .id-stat-num { font-size: 26px; } }
    .id-stat-label {
      font-family: var(--font-hud); font-size: 8px;
      letter-spacing: 0.22em; text-transform: uppercase;
      color: var(--text-lo); margin-top: 6px;
    }

    .profile-tabs {
      display: flex; gap: 4px; padding: 3px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .profile-tabs::-webkit-scrollbar { display: none; }
    [data-theme='stark'] .profile-tabs { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .profile-tabs { border-radius: 0; padding: 0; gap: 0; }
    .profile-tab {
      flex: 1 0 auto;
      min-width: 0;
      display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 9px 10px;
      background: transparent;
      border: none;
      color: var(--text-lo);
      font-family: var(--font-btn);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 180ms ease, color 180ms ease;
    }
    @media (min-width: 480px) {
      .profile-tab { font-size: 11px; padding: 10px 12px; letter-spacing: 0.18em; }
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
      padding: 10px 12px;
      background: var(--bg-input);
      border: 1px solid var(--divider);
      border-radius: var(--input-radius);
    }
    .profile-search-input {
      flex: 1; min-width: 0; background: transparent; border: none; outline: none;
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
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
      min-width: 0;
    }
    @media (min-width: 480px) {
      .profile-request { gap: 10px; padding: 12px 14px; }
    }
    [data-theme='stark'] .profile-request { background: rgba(20,20,14,0.03); }
    .profile-suggest-avatar {
      width: 32px; height: 32px; background: var(--bg-input);
      border-radius: 9px; display: flex; align-items: center; justify-content: center;
      color: var(--text-hi); flex-shrink: 0;
    }
    @media (min-width: 480px) {
      .profile-suggest-avatar { width: 36px; height: 36px; border-radius: 10px; }
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

    /* ─── Sticky tabs ─────────────────────────────────── */
    .profile-tabs-wrap {
      position: sticky;
      top: max(env(safe-area-inset-top, 0px), 0px);
      padding-top: 4px;
      padding-bottom: 4px;
      background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-base) 80%, transparent 100%);
    }
    [data-theme='stark'] .profile-tabs-wrap { background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-base) 80%, transparent 100%); }

    /* ─── Friends sort toolbar ────────────────────────── */
    .profile-toolbar {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .profile-sort {
      display: flex; gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .profile-sort::-webkit-scrollbar { display: none; }
    .profile-sort-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: 99px;
      color: var(--text-lo);
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      white-space: nowrap;
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    [data-theme='stark']  .profile-sort-chip { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .profile-sort-chip { border-radius: 0; border-width: 1.5px; }
    .profile-sort-chip:hover { color: var(--text-mid); }
    .profile-sort-chip.is-on {
      background: var(--accent);
      color: var(--accent-text);
      border-color: transparent;
    }
    [data-theme='chrome'] .profile-sort-chip.is-on { background-size: 300% 100%; animation: chromeFlow 5s linear infinite; }
    [data-theme='sigil']  .profile-sort-chip.is-on { background: transparent; color: var(--accent-flat); border-color: var(--accent-flat); }

    .profile-sort-add {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      background: var(--accent);
      color: var(--accent-text);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 120ms ease;
      flex-shrink: 0;
    }
    .profile-sort-add:active { transform: scale(0.92); }
    [data-theme='brutal'] .profile-sort-add { border-radius: 0; }
    [data-theme='chrome'] .profile-sort-add { background-size: 300% 100%; animation: chromeFlow 5s linear infinite; }
    [data-theme='sigil']  .profile-sort-add { background: transparent; color: var(--accent-flat); border: 1px solid var(--accent-flat); }

    /* ─── Stats: suffix, color distribution, meta ─────── */
    .profile-stat-suffix {
      font-size: 14px;
      color: var(--text-lo);
      margin-left: 2px;
      letter-spacing: 0;
    }
    .profile-color-dist {
      display: flex; flex-direction: column; gap: 8px;
      padding: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark']  .profile-color-dist { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .profile-color-dist { border-radius: 0; border-width: 1.5px; }
    .profile-color-row {
      display: grid;
      grid-template-columns: 12px 18px 1fr 24px;
      align-items: center;
      gap: 10px;
    }
    .profile-color-key {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--text-mid);
    }
    .profile-color-bar-track {
      height: 6px;
      background: rgba(255,255,255,0.05);
      border-radius: 99px;
      overflow: hidden;
    }
    [data-theme='stark']  .profile-color-bar-track { background: rgba(20,20,14,0.06); }
    [data-theme='brutal'] .profile-color-bar-track { border-radius: 0; height: 8px; border: 1px solid var(--text-hi); background: transparent; }
    .profile-color-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 380ms ease;
    }
    [data-theme='brutal'] .profile-color-bar-fill { border-radius: 0; }
    .profile-color-bar-fill.w { background: linear-gradient(90deg, #FFFDE0, #F8E9B4); }
    .profile-color-bar-fill.u { background: linear-gradient(90deg, #B7DDF8, #4F8FCB); }
    .profile-color-bar-fill.b { background: linear-gradient(90deg, #6e5b78, #1a1620); }
    .profile-color-bar-fill.r { background: linear-gradient(90deg, #F8B7B0, #D24F45); }
    .profile-color-bar-fill.g { background: linear-gradient(90deg, #BFE6A6, #5A9A4C); }
    .profile-color-bar-fill.c { background: linear-gradient(90deg, #d8d8e0, #8b8b9e); }
    .profile-color-num {
      font-family: var(--font-life);
      font-weight: var(--life-weight);
      font-size: 14px;
      color: var(--text-hi);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .profile-meta-card {
      padding: 6px 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark']  .profile-meta-card { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .profile-meta-card { border-radius: 0; border-width: 1.5px; }
    .profile-meta-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--divider);
    }
    .profile-meta-row:last-child { border-bottom: none; }
    .profile-meta-key {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
      flex-shrink: 0;
    }
    .profile-meta-val {
      font-family: var(--font-name);
      font-size: 13px;
      color: var(--text-hi);
      min-width: 0;
      text-align: right;
    }

    /* ─── Edit modal: live preview ────────────────────── */
    .edit-preview {
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 12px 18px;
      margin-bottom: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: var(--pod-radius);
    }
    [data-theme='stark']  .edit-preview { background: rgba(20,20,14,0.03); }
    [data-theme='brutal'] .edit-preview { border-radius: 0; border-width: 1.5px; }

    .edit-preview-halo {
      position: relative;
      width: 88px; height: 88px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    .edit-preview-halo::before {
      content: ''; position: absolute; inset: -3px;
      border-radius: 50%;
      padding: 2px;
      background: conic-gradient(from 180deg, var(--halo-from), var(--halo-to), var(--halo-from));
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0.85;
    }
    .edit-preview-halo.w { --halo-from: #FFFDE0; --halo-to: #F8E9B4; }
    .edit-preview-halo.u { --halo-from: #B7DDF8; --halo-to: #4F8FCB; }
    .edit-preview-halo.b { --halo-from: #6e5b78; --halo-to: #1a1620; }
    .edit-preview-halo.r { --halo-from: #F8B7B0; --halo-to: #D24F45; }
    .edit-preview-halo.g { --halo-from: #BFE6A6; --halo-to: #5A9A4C; }
    .edit-preview-halo.c { --halo-from: #d8d8e0; --halo-to: #8b8b9e; }
    [data-theme='brutal'] .edit-preview-halo { border-radius: 0; }
    [data-theme='brutal'] .edit-preview-halo::before { border-radius: 0; background: var(--text-hi); opacity: 1; }

    .edit-preview-avatar {
      width: 100%; height: 100%;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-elevated, rgba(255,255,255,0.04));
      color: var(--text-hi);
    }
    [data-theme='brutal'] .edit-preview-avatar { border-radius: 0; }
    [data-theme='sigil']  .edit-preview-avatar { color: var(--accent-flat); background: rgba(201,162,86,0.06); }

    .edit-preview-name {
      font-family: var(--font-display);
      font-weight: var(--life-weight);
      font-size: 20px;
      letter-spacing: -0.02em;
      color: var(--text-hi);
      margin-top: 2px;
    }
    [data-theme='brutal'] .edit-preview-name { text-transform: uppercase; }
    [data-theme='sigil']  .edit-preview-name { font-style: italic; }
    .edit-preview-color {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--text-lo);
      margin-top: 2px;
    }
  `],
})
export class ProfilePage implements OnInit {
  readonly store = inject(ProfileStore);
  readonly auth = inject(AuthStore);
  readonly requests = inject(FriendRequestsStore);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  readonly tab = signal<'friends' | 'requests' | 'search' | 'stats'>('friends');
  readonly friendSort = signal<'wins' | 'games' | 'name'>('wins');
  readonly perforations = Array.from({ length: 28 });
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
  readonly sortedFriends = computed(() => {
    const sort = this.friendSort();
    const arr = [...this.store.friends()];
    if (sort === 'name') return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'games') return arr.sort((a, b) => (b.games - a.games) || (b.wins - a.wins));
    return arr.sort((a, b) => (b.wins - a.wins) || (b.games - a.games));
  });
  readonly winratePct = computed(() => {
    const wins = this.totalWins();
    const games = this.store.friends().reduce((sum, f) => sum + f.games, 0);
    if (games === 0) return 0;
    return Math.round((wins / games) * 100);
  });
  readonly colorDistribution = computed(() => {
    const friends = this.store.friends();
    if (friends.length === 0) return [];
    const counts = new Map<ManaColor, number>();
    for (const f of friends) counts.set(f.color, (counts.get(f.color) ?? 0) + 1);
    const total = friends.length;
    return COLORS
      .map((c) => ({ color: c, count: counts.get(c) ?? 0, pct: Math.round(((counts.get(c) ?? 0) / total) * 100) }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  });
  readonly searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q.length < 1) return [];
    // Remote results take priority when API enabled, supplemented with email field hidden
    const remote = this.requests.searchResults();
    if (remote.length > 0) {
      return remote.map((u) => ({
        id: u.id, email: '', username: u.username, displayName: u.displayName,
        color: u.color, avatar: u.avatar,
      }));
    }
    return this.auth.otherAccounts().filter((a) =>
      a.displayName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  onSearchChange(v: string) {
    this.searchQuery.set(v);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      void this.requests.searchUsers(v);
    }, 250);
  }

  async ngOnInit() {
    await this.auth.load();
    const me = this.auth.me();
    await this.store.setScope(me?.id ?? null);
    await this.store.load();
    await this.requests.load();
    if (!me) void this.router.navigate(['/sign-in']);
  }

  async ionViewWillEnter() {
    await this.requests.reload();
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

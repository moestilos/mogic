import type { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from './core/stores/auth.store';
import { ThemeStore } from './core/stores/theme.store';

const requireTheme = async () => {
  const theme = inject(ThemeStore);
  const router = inject(Router);
  await theme.load();
  if (!theme.hasChosen()) {
    void router.navigate(['/onboard-theme']);
    return false;
  }
  return true;
};

const requireAuth = async () => {
  const theme = inject(ThemeStore);
  const auth = inject(AuthStore);
  const router = inject(Router);
  await theme.load();
  if (!theme.hasChosen()) {
    void router.navigate(['/onboard-theme']);
    return false;
  }
  await auth.load();
  if (!auth.isSignedIn()) {
    void router.navigate(['/sign-in']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: 'onboard-theme', loadComponent: () => import('./features/onboard/onboard-theme.page').then((m) => m.OnboardThemePage) },
  { path: 'sign-in', canActivate: [requireTheme], loadComponent: () => import('./features/auth/sign-in.page').then((m) => m.SignInPage) },
  { path: '', canActivate: [requireAuth], loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage) },
  { path: 'new-game', canActivate: [requireAuth], loadComponent: () => import('./features/new-game/new-game.page').then((m) => m.NewGamePage) },
  { path: 'game', canActivate: [requireAuth], loadComponent: () => import('./features/game/game.page').then((m) => m.GamePage) },
  { path: 'groups', canActivate: [requireAuth], loadComponent: () => import('./features/groups/groups.page').then((m) => m.GroupsPage) },
  { path: 'groups/new', canActivate: [requireAuth], loadComponent: () => import('./features/groups/group-new.page').then((m) => m.GroupNewPage) },
  { path: 'groups/:id', canActivate: [requireAuth], loadComponent: () => import('./features/groups/group-detail.page').then((m) => m.GroupDetailPage) },
  { path: 'profile', canActivate: [requireAuth], loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage) },
];

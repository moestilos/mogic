import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private deferred: BeforeInstallPromptEvent | null = null;
  readonly canInstall = signal(false);
  readonly isStandalone = signal(false);
  readonly isIOS = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;

    // Detect standalone (already installed)
    const std =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    this.isStandalone.set(std);

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
    this.isIOS.set(iOS);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canInstall.set(false);
      this.isStandalone.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.canInstall.set(false);
  }
}

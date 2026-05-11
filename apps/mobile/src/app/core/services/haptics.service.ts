import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class HapticsService {
  async light() {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* web noop */ }
  }
  async medium() {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* web noop */ }
  }
  async heavy() {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch { /* web noop */ }
  }
  async warning() {
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch { /* web noop */ }
  }
  async error() {
    try { await Haptics.notification({ type: NotificationType.Error }); } catch { /* web noop */ }
  }
  async success() {
    try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* web noop */ }
  }
}

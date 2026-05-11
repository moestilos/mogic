import { Injectable, effect, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemeId = 'chrome' | 'editorial' | 'vapor' | 'brutal' | 'sigil' | 'stark';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  tags: string[];
}

export const THEMES: ThemeMeta[] = [
  { id: 'chrome',    name: 'Liquid Chrome',     tagline: 'Foil iridiscente animado.',              tags: ['Premium', 'Iridescent'] },
  { id: 'editorial', name: 'Editorial Mono',    tagline: 'Linear-meets-Notes. Sin color.',         tags: ['Quiet', 'Serif'] },
  { id: 'vapor',     name: 'Vapor',             tagline: 'Vision Pro. Frosted glass + auroras.',   tags: ['Frosted', 'Soft'] },
  { id: 'brutal',    name: 'Carbon Brutalist',  tagline: 'Print-shop. Grid visible, mono total.',  tags: ['Mono', 'Loud'] },
  { id: 'sigil',     name: 'Sigil',             tagline: 'Arcana moderna. Acento dorado.',         tags: ['Serif', 'Reverent'] },
  { id: 'stark',     name: 'Stark Field',       tagline: 'Light mode. Tipografía arquitectónica.', tags: ['Light', 'Type'] },
];

const STORAGE_KEY = 'crown.theme';
const CHOSEN_KEY = 'crown.themeChosen';
const DEFAULT_THEME: ThemeId = 'chrome';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _current = signal<ThemeId>(DEFAULT_THEME);
  private readonly _hasChosen = signal<boolean>(false);
  private readonly _loaded = signal<boolean>(false);

  readonly current = this._current.asReadonly();
  readonly hasChosen = this._hasChosen.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly themes = THEMES;

  constructor() {
    effect(() => {
      const id = this._current();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', id);
        document.body.setAttribute('data-theme', id);
      }
    });
    void this.load();
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    try {
      const [{ value: themeVal }, { value: chosenVal }] = await Promise.all([
        Preferences.get({ key: STORAGE_KEY }),
        Preferences.get({ key: CHOSEN_KEY }),
      ]);
      if (themeVal && THEMES.some((t) => t.id === themeVal)) {
        this._current.set(themeVal as ThemeId);
      }
      this._hasChosen.set(chosenVal === '1');
    } catch {
      /* web noop */
    }
    this._loaded.set(true);
  }

  async preview(id: ThemeId): Promise<void> {
    this._current.set(id);
  }

  async set(id: ThemeId): Promise<void> {
    this._current.set(id);
    this._hasChosen.set(true);
    try {
      await Preferences.set({ key: STORAGE_KEY, value: id });
      await Preferences.set({ key: CHOSEN_KEY, value: '1' });
    } catch {
      /* web noop */
    }
  }
}

import { Injectable, effect, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemeId = 'chrome' | 'editorial' | 'vapor' | 'brutal' | 'sigil' | 'stark' | 'cards';

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
  { id: 'cards',     name: 'Card Sigil',        tagline: 'Cartas tarot, ink frame, gold foil.',    tags: ['Tarot', 'Foil'] },
];

const STORAGE_KEY = 'crown.theme';
const CHOSEN_KEY = 'crown.themeChosen';
const BRUTAL_ACCENT_KEY = 'crown.brutalAccent';
const DEFAULT_THEME: ThemeId = 'brutal';

export type BrutalAccent = 'white' | 'green' | 'blue' | 'red' | 'purple' | 'yellow' | 'orange' | 'cyan' | 'pink';

export const BRUTAL_ACCENTS: { id: BrutalAccent; label: string; hex: string }[] = [
  { id: 'white',  label: 'Blanco',  hex: '#ffffff' },
  { id: 'green',  label: 'Verde',   hex: '#4aff7a' },
  { id: 'blue',   label: 'Azul',    hex: '#4a9eff' },
  { id: 'red',    label: 'Rojo',    hex: '#ff4a4a' },
  { id: 'purple', label: 'Morado',  hex: '#b366ff' },
  { id: 'yellow', label: 'Amarillo', hex: '#ffea4a' },
  { id: 'orange', label: 'Naranja', hex: '#ff8c33' },
  { id: 'cyan',   label: 'Cian',    hex: '#4adfff' },
  { id: 'pink',   label: 'Rosa',    hex: '#ff66c2' },
];

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _current = signal<ThemeId>(DEFAULT_THEME);
  private readonly _hasChosen = signal<boolean>(false);
  private readonly _loaded = signal<boolean>(false);
  private readonly _brutalAccent = signal<BrutalAccent>('white');

  readonly current = this._current.asReadonly();
  readonly hasChosen = this._hasChosen.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly brutalAccent = this._brutalAccent.asReadonly();
  readonly themes = THEMES;
  readonly brutalAccents = BRUTAL_ACCENTS;

  constructor() {
    effect(() => {
      const id = this._current();
      const accent = this._brutalAccent();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', id);
        document.body.setAttribute('data-theme', id);
        document.documentElement.setAttribute('data-brutal-accent', accent);
        document.body.setAttribute('data-brutal-accent', accent);
      }
    });
    void this.load();
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    try {
      const [{ value: themeVal }, { value: chosenVal }, { value: accentVal }] = await Promise.all([
        Preferences.get({ key: STORAGE_KEY }),
        Preferences.get({ key: CHOSEN_KEY }),
        Preferences.get({ key: BRUTAL_ACCENT_KEY }),
      ]);
      if (themeVal && THEMES.some((t) => t.id === themeVal)) {
        this._current.set(themeVal as ThemeId);
      }
      this._hasChosen.set(chosenVal === '1');
      if (accentVal && BRUTAL_ACCENTS.some((a) => a.id === accentVal)) {
        this._brutalAccent.set(accentVal as BrutalAccent);
      }
    } catch {
      /* web noop */
    }
    this._loaded.set(true);
  }

  async setBrutalAccent(id: BrutalAccent): Promise<void> {
    this._brutalAccent.set(id);
    try {
      await Preferences.set({ key: BRUTAL_ACCENT_KEY, value: id });
    } catch {
      /* web noop */
    }
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

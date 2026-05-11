# Architecture

## Capas

```
[ Ionic Angular App ]
        │
        ├── core/services      Haptics, Storage, Sync, Audio, Scryfall
        ├── core/stores        SignalStore (game, settings, profile)
        ├── shared/ui          Reusable components (GlassCard, NeonButton…)
        ├── features/          Pages (home, new-game, game, history…)
        │
        └─→ @crown/game-engine (TS puro, testeable, sin deps)
                │
                ├── types.ts
                └── game.ts    createGame, adjust*, nextTurn, undo…

[ Capacitor plugins ]  Haptics · Preferences · StatusBar · Keyboard
[ Supabase (futuro) ]  auth · realtime · postgres · edge functions
```

## Principios

1. **Local-first.** Partida activa en `Capacitor Preferences`. Funciona 100% offline.
2. **Engine puro.** Cero UI, cero plataforma. Testeable en Node con vitest.
3. **Event-sourced.** Cada acción = event en `events[]`. Undo = pop + rebuild.
4. **Signals everywhere.** GameStore expone signals + computed. No RxJS para state.
5. **Componentes standalone.** Sin NgModules.

## Sync futuro (v1.1)

Un device = host. Genera `sync_code` + QR. Otros devices scanean → Supabase Realtime channel `game:{code}` → replican eventos. Host = autoridad. Resolución conflicts = last-write-wins por timestamp (acceptable: humanos no spamean botones simultáneos en commander).

## AI (v1.3)

Edge function `explain-card` proxy a Anthropic Claude Haiku 4.5. Input: nombre carta + contexto board. Output: 2–3 frases explicación interacción. Cache por `(card, lang)` 30d.

## Métricas

- D7 / D30 retention
- Partidas/usuario/semana
- Avg game duration
- Crown+ conversion @ recap screen

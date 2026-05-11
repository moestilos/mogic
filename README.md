# Mogic — MTG Commander Companion

Modern, premium, mobile-first app to play physical Magic: The Gathering — replaces life counter, dice, counters, turn tracking, with smart social features on top.

## Stack

- **Frontend:** Angular 19 + Ionic 8 + Capacitor 6
- **Style:** TailwindCSS + CSS variables
- **State:** Angular Signals
- **Engine:** TS puro, testeado con Vitest (`packages/game-engine`)
- **Backend (futuro):** Supabase (auth + realtime + storage)
- **Targets:** iOS, Android, PWA fallback

## Monorepo

```
crown/
├── apps/mobile/        Ionic Angular app
├── packages/
│   ├── game-engine/    Lógica pura, sin UI
│   └── shared-types/   Tipos compartidos
└── docs/
```

## Quick start

```bash
pnpm install
pnpm test:engine            # corre vitest sobre game-engine
pnpm dev:mobile             # ng serve en http://localhost:4200
```

### Añadir plataformas nativas

```bash
cd apps/mobile
pnpm build
npx cap add ios
npx cap add android
pnpm sync:ios
pnpm open:ios
```

## Estado MVP

- [x] Game engine (vida, counters, commander damage, turnos, fases, undo, revive)
- [x] Test suite engine (17 tests verde)
- [x] Home + New Game wizard
- [x] Pantalla partida: pods dinámicos 2–6, tap zones, haptics, dado D20, undo
- [x] **Liga personal: grupos + standings + tracking automático rachas/winrate/avg placement**
- [x] iPad/tablet responsive (md/lg breakpoints)
- [ ] Drawer counters (poison/energy/exp/storm)
- [ ] Commander damage matrix
- [ ] Recap pantalla fin partida con animación
- [ ] Sync QR multi-device
- [ ] Card scan + Scryfall + AI explainer

## Liga personal (grupos)

Pensada para uso personal — un grupo de amigos que se reúne a jugar Commander.

- Crear grupos con nombre + emoji
- Añadir miembros con color preferido
- Empezar partida desde grupo → resultados se registran automáticamente
- Standings: wins, podios, win rate, avg placement, streak actual + best streak
- Historia completa por partida con placements

Todo local. Cero backend. Datos en `Capacitor Preferences` por device.

Ver `docs/ROADMAP.md` para detalle.

## Diseño

- Dark first. Glassmorphism ligero. Neón sutil.
- Pulgar reachable. Una mano. Tap targets ≥44pt.
- Sin ads. Sin paywall core. Ever.

Ver `docs/DESIGN.md`.

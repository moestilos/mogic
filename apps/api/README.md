# @mogic/api

Vercel Node API for Mogic. **Stack**: Hono + Drizzle ORM + Neon Postgres + JWT (jose) + bcryptjs.

## Estructura

```
apps/api/
├── api/index.ts        # Vercel function entry (handle(app))
├── src/
│   ├── app.ts          # Hono root con basePath /api + CORS
│   ├── auth.ts         # JWT sign/verify + bcrypt
│   ├── middleware.ts   # authRequired
│   ├── db/
│   │   ├── client.ts   # neon-http + drizzle
│   │   └── schema.ts   # 5 tablas mogic_*
│   └── routes/
│       ├── auth.ts     # /register /login /me PATCH /me
│       ├── friends.ts  # CRUD + /record-game (wins+games incr)
│       └── groups.ts   # CRUD + profiles + results
├── drizzle.config.ts
├── vercel.json         # rewrite /api/* → /api/index
└── tsconfig.json
```

## Deploy (paso a paso)

### 1. Neon DB
1. Crea proyecto Neon → copia `DATABASE_URL` connection string (pooled)
2. Local: `cp .env.example .env` + pega URL

### 2. Migraciones
```bash
cd apps/api
pnpm install
pnpm db:generate    # genera SQL
pnpm db:push        # aplica directamente a Neon
```

### 3. Vercel
1. `vercel link` desde `apps/api`
2. Env vars en Vercel dashboard:
   - `DATABASE_URL` (Neon pooled URL)
   - `JWT_SECRET` (32+ chars random)
3. `vercel --prod`

### 4. Frontend
En `apps/mobile`, set la base URL antes del bootstrap (ej. en `index.html`):
```html
<script>window.__MOGIC_API_URL__ = 'https://mogic-api.vercel.app';</script>
```
O env build flag — `src/environments/api.ts` lee de `window.__MOGIC_API_URL__`.

Cuando `API_ENABLED=true`, frontend usa `ApiService` para auth/friends/groups. Si vacío → local-only.

## Endpoints

| Método | Path                           | Auth | Body / params |
|--------|--------------------------------|------|---------------|
| POST   | `/api/auth/register`           | —    | email, password, displayName, color, avatar |
| POST   | `/api/auth/login`              | —    | email, password |
| GET    | `/api/auth/me`                 | jwt  | — |
| PATCH  | `/api/auth/me`                 | jwt  | displayName? color? avatar? theme? |
| GET    | `/api/friends/`                | jwt  | — |
| POST   | `/api/friends/`                | jwt  | displayName, color, avatar |
| PATCH  | `/api/friends/:id`             | jwt  | partial |
| DELETE | `/api/friends/:id`             | jwt  | — |
| POST   | `/api/friends/record-game`     | jwt  | winnerFriendId?, participantFriendIds[] |
| GET    | `/api/groups/`                 | jwt  | — |
| POST   | `/api/groups/`                 | jwt  | name, icon |
| GET    | `/api/groups/:id`              | jwt  | → group + profiles + results |
| PATCH  | `/api/groups/:id`              | jwt  | name? icon? |
| DELETE | `/api/groups/:id`              | jwt  | — |
| POST   | `/api/groups/:id/profiles`     | jwt  | friendId?, displayName, color, avatar |
| DELETE | `/api/groups/:id/profiles/:pid`| jwt  | — |
| POST   | `/api/groups/:id/results`      | jwt  | format, startedAt, endedAt, placements[] |

## Schema (mogic_*)

- `mogic_users` — id, email (unique), passwordHash, username (unique), displayName, color, avatar, theme, createdAt, updatedAt
- `mogic_friends` — id, ownerId→users, friendUserId?→users, displayName, color, avatar, wins, games, addedAt
- `mogic_groups` — id, ownerId→users, name, icon, createdAt
- `mogic_group_profiles` — id, groupId→groups, friendId?→friends, displayName, color, avatar, position
- `mogic_group_results` — id, groupId→groups, format, startedAt, endedAt, placements jsonb

## Seguridad

- JWT HS256 con expiración 30d
- bcryptjs cost 10 para password
- CORS abierto (cliente público, sin cookies)
- RLS no necesario: cada query filtra por `owner_id = auth.uid()` via middleware `authRequired`
- Validación zod en todos los inputs

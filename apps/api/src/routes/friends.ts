import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { authRequired, getUser } from '../middleware';

const newFriendSchema = z.object({
  displayName: z.string().min(1).max(40),
  color: z.enum(['W', 'U', 'B', 'R', 'G', 'C']).default('U'),
  avatar: z.string().min(1).max(40).default('User'),
  friendUserId: z.string().uuid().optional(),
});

const patchFriendSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  color: z.enum(['W', 'U', 'B', 'R', 'G', 'C']).optional(),
  avatar: z.string().min(1).max(40).optional(),
});

const winInputSchema = z.object({
  winnerFriendId: z.string().uuid().optional(),
  participantFriendIds: z.array(z.string().uuid()).default([]),
});

const app = new Hono();
app.use('*', authRequired);

app.get('/', async (c) => {
  const u = getUser(c);
  const rows = await db.select().from(schema.friends)
    .where(eq(schema.friends.ownerId, u.sub))
    .orderBy(desc(schema.friends.addedAt));
  return c.json({ friends: rows });
});

app.post('/', async (c) => {
  const u = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = newFriendSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const [friend] = await db.insert(schema.friends).values({
    ownerId: u.sub,
    friendUserId: parsed.data.friendUserId,
    displayName: parsed.data.displayName,
    color: parsed.data.color,
    avatar: parsed.data.avatar,
  }).returning();
  return c.json({ friend });
});

app.patch('/:id', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const parsed = patchFriendSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  if (Object.keys(parsed.data).length === 0) return c.json({ error: 'empty patch' }, 400);
  const [friend] = await db.update(schema.friends)
    .set(parsed.data)
    .where(and(eq(schema.friends.id, id), eq(schema.friends.ownerId, u.sub)))
    .returning();
  if (!friend) return c.json({ error: 'not found' }, 404);
  return c.json({ friend });
});

app.delete('/:id', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  const deleted = await db.delete(schema.friends)
    .where(and(eq(schema.friends.id, id), eq(schema.friends.ownerId, u.sub)))
    .returning();
  if (deleted.length === 0) return c.json({ error: 'not found' }, 404);
  return c.json({ ok: true });
});

/** Record win + participation for a finished game. */
app.post('/record-game', async (c) => {
  const u = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = winInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const { winnerFriendId, participantFriendIds } = parsed.data;
  const safeIds = participantFriendIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));

  if (safeIds.length > 0) {
    const owned = await db.select({ id: schema.friends.id }).from(schema.friends)
      .where(and(eq(schema.friends.ownerId, u.sub), inArray(schema.friends.id, safeIds)));
    const ownedIds = owned.map((r) => r.id);
    if (ownedIds.length > 0) {
      await db.update(schema.friends)
        .set({ games: sql`${schema.friends.games} + 1` })
        .where(and(eq(schema.friends.ownerId, u.sub), inArray(schema.friends.id, ownedIds)));
    }
  }

  if (winnerFriendId && /^[0-9a-f-]{36}$/i.test(winnerFriendId)) {
    const winnerOwned = await db.select({ id: schema.friends.id }).from(schema.friends)
      .where(and(eq(schema.friends.id, winnerFriendId), eq(schema.friends.ownerId, u.sub)))
      .limit(1);
    if (winnerOwned.length > 0) {
      await db.update(schema.friends)
        .set({ wins: sql`${schema.friends.wins} + 1` })
        .where(and(eq(schema.friends.id, winnerFriendId), eq(schema.friends.ownerId, u.sub)));
    }
  }
  return c.json({ ok: true });
});

export default app;

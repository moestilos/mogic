import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { users, friends, friendRequests } from '../db/schema';
import { authRequired, getUser } from '../middleware';

const sendSchema = z.object({ toUserId: z.string().uuid() });
const idSchema = z.object({ id: z.string().uuid() });

const app = new Hono();
app.use('*', authRequired);

app.get('/search', async (c) => {
  const u = getUser(c);
  const q = (c.req.query('q') ?? '').trim().toLowerCase();
  if (q.length < 1) return c.json({ users: [] });
  const safe = q.replace(/[%_]/g, '\\$&');
  const rows = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    color: users.color,
    avatar: users.avatar,
  }).from(users)
    .where(
      sql`${users.id} != ${u.sub} AND (
        lower(${users.username}) like ${'%' + safe + '%'} OR
        lower(${users.displayName}) like ${'%' + safe + '%'} OR
        lower(${users.email}) like ${'%' + safe + '%'}
      )`
    )
    .limit(20);
  return c.json({ users: rows });
});

app.get('/', async (c) => {
  const u = getUser(c);
  const rows = await db.select().from(friendRequests)
    .where(or(eq(friendRequests.fromUserId, u.sub), eq(friendRequests.toUserId, u.sub)))
    .orderBy(desc(friendRequests.createdAt));
  return c.json({ requests: rows });
});

app.post('/', async (c) => {
  const u = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  if (parsed.data.toUserId === u.sub) return c.json({ error: 'cannot friend self' }, 400);

  const existing = await db.select().from(friendRequests).where(
    or(
      and(eq(friendRequests.fromUserId, u.sub), eq(friendRequests.toUserId, parsed.data.toUserId)),
      and(eq(friendRequests.fromUserId, parsed.data.toUserId), eq(friendRequests.toUserId, u.sub)),
    )
  ).limit(1);
  if (existing.length > 0) {
    const r = existing[0];
    if (r.status === 'pending') return c.json({ error: 'request pending' }, 409);
    if (r.status === 'accepted') return c.json({ error: 'already friends' }, 409);
  }

  const [req] = await db.insert(friendRequests).values({
    fromUserId: u.sub,
    toUserId: parsed.data.toUserId,
    status: 'pending',
  }).returning();
  return c.json({ request: req });
});

app.post('/:id/accept', async (c) => {
  const u = getUser(c);
  const parsed = idSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) return c.json({ error: 'invalid id' }, 400);

  const [r] = await db.select().from(friendRequests)
    .where(and(eq(friendRequests.id, parsed.data.id), eq(friendRequests.toUserId, u.sub))).limit(1);
  if (!r) return c.json({ error: 'not found' }, 404);
  if (r.status !== 'pending') return c.json({ error: 'already processed' }, 409);

  await db.update(friendRequests)
    .set({ status: 'accepted', respondedAt: new Date() })
    .where(eq(friendRequests.id, r.id));

  // Crear entradas en friends para ambos lados (linked friend_user_id)
  const [from] = await db.select().from(users).where(eq(users.id, r.fromUserId)).limit(1);
  const [to] = await db.select().from(users).where(eq(users.id, r.toUserId)).limit(1);
  if (from && to) {
    await db.insert(friends).values([
      { ownerId: r.toUserId, friendUserId: r.fromUserId, displayName: from.displayName, color: from.color, avatar: from.avatar },
      { ownerId: r.fromUserId, friendUserId: r.toUserId, displayName: to.displayName, color: to.color, avatar: to.avatar },
    ]).onConflictDoNothing();
  }
  return c.json({ ok: true });
});

app.post('/:id/decline', async (c) => {
  const u = getUser(c);
  const parsed = idSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) return c.json({ error: 'invalid id' }, 400);
  const result = await db.update(friendRequests)
    .set({ status: 'declined', respondedAt: new Date() })
    .where(and(
      eq(friendRequests.id, parsed.data.id),
      eq(friendRequests.toUserId, u.sub),
      eq(friendRequests.status, 'pending'),
    )).returning();
  if (result.length === 0) return c.json({ error: 'not found' }, 404);
  return c.json({ ok: true });
});

app.post('/:id/cancel', async (c) => {
  const u = getUser(c);
  const parsed = idSchema.safeParse({ id: c.req.param('id') });
  if (!parsed.success) return c.json({ error: 'invalid id' }, 400);
  const result = await db.update(friendRequests)
    .set({ status: 'cancelled', respondedAt: new Date() })
    .where(and(
      eq(friendRequests.id, parsed.data.id),
      eq(friendRequests.fromUserId, u.sub),
      eq(friendRequests.status, 'pending'),
    )).returning();
  if (result.length === 0) return c.json({ error: 'not found' }, 404);
  return c.json({ ok: true });
});

export default app;

import { Hono } from 'hono';
import { z } from 'zod';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { authRequired, getUser } from '../middleware';

const newGroupSchema = z.object({
  name: z.string().min(2).max(60),
  icon: z.string().min(1).max(40).default('Crown'),
});

const patchGroupSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  icon: z.string().min(1).max(40).optional(),
});

const newGroupProfileSchema = z.object({
  friendId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(40),
  color: z.enum(['W', 'U', 'B', 'R', 'G', 'C']).default('U'),
  avatar: z.string().min(1).max(40).default('User'),
});

const placementsSchema = z.array(z.object({
  profileId: z.string().uuid(),
  placement: z.number().int().positive(),
}));

const newResultSchema = z.object({
  format: z.string().min(1).max(40).default('commander'),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  placements: placementsSchema,
});

const app = new Hono();
app.use('*', authRequired);

async function ownsGroup(userId: string, groupId: string): Promise<boolean> {
  const [g] = await db.select({ id: schema.groups.id }).from(schema.groups)
    .where(and(eq(schema.groups.id, groupId), eq(schema.groups.ownerId, userId))).limit(1);
  return !!g;
}

app.get('/', async (c) => {
  const u = getUser(c);
  const rows = await db.select().from(schema.groups)
    .where(eq(schema.groups.ownerId, u.sub))
    .orderBy(desc(schema.groups.createdAt));
  return c.json({ groups: rows });
});

app.post('/', async (c) => {
  const u = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = newGroupSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const [group] = await db.insert(schema.groups).values({
    ownerId: u.sub,
    name: parsed.data.name,
    icon: parsed.data.icon,
  }).returning();
  return c.json({ group });
});

app.get('/:id', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id)).limit(1);
  const profiles = await db.select().from(schema.groupProfiles)
    .where(eq(schema.groupProfiles.groupId, id))
    .orderBy(asc(schema.groupProfiles.position));
  const results = await db.select().from(schema.groupResults)
    .where(eq(schema.groupResults.groupId, id))
    .orderBy(desc(schema.groupResults.endedAt));
  return c.json({ group, profiles, results });
});

app.patch('/:id', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  const body = await c.req.json().catch(() => null);
  const parsed = patchGroupSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  if (Object.keys(parsed.data).length === 0) return c.json({ error: 'empty patch' }, 400);
  const [group] = await db.update(schema.groups).set(parsed.data).where(eq(schema.groups.id, id)).returning();
  return c.json({ group });
});

app.delete('/:id', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  await db.delete(schema.groups).where(eq(schema.groups.id, id));
  return c.json({ ok: true });
});

app.post('/:id/profiles', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  const body = await c.req.json().catch(() => null);
  const parsed = newGroupProfileSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const existing = await db.select({ id: schema.groupProfiles.id }).from(schema.groupProfiles)
    .where(eq(schema.groupProfiles.groupId, id));
  const [profile] = await db.insert(schema.groupProfiles).values({
    groupId: id,
    friendId: parsed.data.friendId,
    displayName: parsed.data.displayName,
    color: parsed.data.color,
    avatar: parsed.data.avatar,
    position: existing.length,
  }).returning();
  return c.json({ profile });
});

app.delete('/:id/profiles/:profileId', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  const profileId = c.req.param('profileId');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  await db.delete(schema.groupProfiles)
    .where(and(eq(schema.groupProfiles.id, profileId), eq(schema.groupProfiles.groupId, id)));
  return c.json({ ok: true });
});

app.post('/:id/results', async (c) => {
  const u = getUser(c);
  const id = c.req.param('id');
  if (!(await ownsGroup(u.sub, id))) return c.json({ error: 'not found' }, 404);
  const body = await c.req.json().catch(() => null);
  const parsed = newResultSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input', issues: parsed.error.issues }, 400);
  const [result] = await db.insert(schema.groupResults).values({
    groupId: id,
    format: parsed.data.format,
    startedAt: new Date(parsed.data.startedAt),
    endedAt: new Date(parsed.data.endedAt),
    placements: parsed.data.placements,
  }).returning();
  return c.json({ result });
});

export default app;

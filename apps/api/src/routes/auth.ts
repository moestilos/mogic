import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { hashPassword, signToken, verifyPassword } from '../auth';
import { authRequired, getUser } from '../middleware';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  displayName: z.string().min(2).max(40),
  color: z.enum(['W', 'U', 'B', 'R', 'G', 'C']).default('U'),
  avatar: z.string().min(1).max(40).default('Crown'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profilePatchSchema = z.object({
  displayName: z.string().min(2).max(40).optional(),
  color: z.enum(['W', 'U', 'B', 'R', 'G', 'C']).optional(),
  avatar: z.string().min(1).max(40).optional(),
  theme: z.string().min(1).max(20).optional(),
});

const app = new Hono();

app.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input', issues: parsed.error.issues }, 400);
  const { email, password, displayName, color, avatar } = parsed.data;

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) return c.json({ error: 'email already registered' }, 409);

  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  let username = baseUsername || `player${Date.now().toString(36).slice(-4)}`;
  let attempt = 0;
  while (true) {
    const conflict = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    if (conflict.length === 0) break;
    attempt += 1;
    username = `${baseUsername}${attempt}`;
    if (attempt > 50) { username = `${baseUsername}${Date.now().toString(36).slice(-4)}`; break; }
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(schema.users).values({
    email: email.toLowerCase(),
    passwordHash,
    username,
    displayName,
    color,
    avatar,
  }).returning();

  const token = await signToken({ sub: user.id, email: user.email, username: user.username });
  return c.json({
    token,
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      color: user.color,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
});

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const { email, password } = parsed.data;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  if (!user) return c.json({ error: 'invalid credentials' }, 401);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return c.json({ error: 'invalid credentials' }, 401);

  const token = await signToken({ sub: user.id, email: user.email, username: user.username });
  return c.json({
    token,
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      color: user.color,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
});

app.get('/me', authRequired, async (c) => {
  const u = getUser(c);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, u.sub)).limit(1);
  if (!user) return c.json({ error: 'not found' }, 404);
  return c.json({
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      color: user.color,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
});

app.patch('/me', authRequired, async (c) => {
  const u = getUser(c);
  const body = await c.req.json().catch(() => null);
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid input' }, 400);
  const patch = parsed.data;
  if (Object.keys(patch).length === 0) return c.json({ error: 'empty patch' }, 400);
  const [user] = await db.update(schema.users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.users.id, u.sub))
    .returning();
  return c.json({
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      color: user.color,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
});

export default app;

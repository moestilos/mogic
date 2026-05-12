import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';
import { authRequired, getUser } from '../middleware';

const ADMIN_EMAILS = new Set(['gmateosoficial@gmail.com']);

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

const app = new Hono();
app.use('*', authRequired);

app.get('/users', async (c) => {
  const u = getUser(c);
  if (!isAdmin(u.email)) return c.json({ error: 'forbidden' }, 403);
  const rows = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    displayName: users.displayName,
    color: users.color,
    avatar: users.avatar,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(500);
  return c.json({ users: rows });
});

export default app;

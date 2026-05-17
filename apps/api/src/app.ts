import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import friends from './routes/friends';
import friendRequests from './routes/friend-requests';
import groups from './routes/groups';
import admin from './routes/admin';

const app = new Hono({ strict: false }).basePath('/api');

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}));

app.get('/', (c) => c.json({ name: 'mogic-api', version: '0.1.0', ok: true }));
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.route('/auth', auth);
app.route('/friends', friends);
app.route('/friend-requests', friendRequests);
app.route('/groups', groups);
app.route('/admin', admin);

app.onError((err, c) => {
  console.error('[mogic-api]', err);
  return c.json({ error: 'server error', message: err.message }, 500);
});

app.notFound((c) => c.json({ error: 'not found' }, 404));

export default app;

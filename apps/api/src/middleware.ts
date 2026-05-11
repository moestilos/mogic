import type { Context, MiddlewareHandler } from 'hono';
import { verifyToken, type JwtPayload } from './auth';

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const authRequired: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization') ?? c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'invalid token' }, 401);
  c.set('user', payload);
  await next();
};

export function getUser(c: Context): JwtPayload {
  return c.get('user');
}

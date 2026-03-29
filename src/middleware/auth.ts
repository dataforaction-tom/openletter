import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import * as db from '../lib/db.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: { id: string; email: string; name: string | null };
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session');
  if (!sessionId) {
    return c.redirect('/login');
  }

  const session = db.getSession(sessionId);
  if (!session) {
    return c.redirect('/login');
  }

  c.set('user', {
    id: session.user_id,
    email: session.user_email,
    name: session.user_name ?? null,
  });

  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session');
  if (sessionId) {
    const session = db.getSession(sessionId);
    if (session) {
      c.set('user', {
        id: session.user_id,
        email: session.user_email,
        name: session.user_name ?? null,
      });
    }
  }
  await next();
}

export async function requireAdmin(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session');
  if (!sessionId) {
    return c.redirect('/login');
  }

  const session = db.getSession(sessionId);
  if (!session) {
    return c.redirect('/login');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user_email !== adminEmail) {
    return c.text('Forbidden', 403);
  }

  c.set('user', {
    id: session.user_id,
    email: session.user_email,
    name: session.user_name ?? null,
  });

  await next();
}

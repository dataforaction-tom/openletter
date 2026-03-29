import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import * as db from '../lib/db.js';
import { generateId, generateToken } from '../lib/nanoid.js';
import { sendMagicLink } from '../lib/email.js';
import { loginPage } from '../views/login.js';

const app = new Hono();

app.get('/login', (c) => {
  const error = c.req.query('error');
  return c.html(
    loginPage({
      error: error === 'invalid' ? 'Invalid or expired link. Please try again.' : undefined,
    })
  );
});

app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = (body['email'] as string || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.html(loginPage({ error: 'Please enter a valid email address.' }));
  }

  const existingUser = db.getUserByEmail(email);
  const token = generateToken();
  const tokenId = generateId();

  if (existingUser) {
    db.createAuthToken(tokenId, email, token, 'login', existingUser.id);
  } else {
    db.createAuthToken(tokenId, email, token, 'signup');
  }

  await sendMagicLink(email, token, existingUser ? 'login' : 'signup');

  return c.html(loginPage({ sent: true, email }));
});

app.get('/auth/verify', (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.redirect('/login?error=invalid');
  }

  const authToken = db.getAuthToken(token);
  if (!authToken) {
    return c.redirect('/login?error=invalid');
  }

  let userId: string;

  if (authToken.type === 'signup') {
    const newUser = db.createUser(generateId(), authToken.email);
    db.setTosAccepted(newUser.id);
    userId = newUser.id;
  } else {
    if (!authToken.user_id) {
      return c.redirect('/login?error=invalid');
    }
    userId = authToken.user_id;
  }

  db.markTokenUsed(token);

  const sessionId = generateId();
  db.createSession(sessionId, userId);

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return c.redirect('/dashboard');
});

app.get('/logout', (c) => {
  const sessionId = getCookie(c, 'session');
  if (sessionId) {
    db.deleteSession(sessionId);
  }
  deleteCookie(c, 'session', { path: '/' });
  return c.redirect('/');
});

export default app;

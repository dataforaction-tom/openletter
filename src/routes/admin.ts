import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAdmin } from '../middleware/auth.js';
import * as db from '../lib/db.js';
import { layout } from '../views/layout.js';
import { adminDashboardPage } from '../views/admin/index.js';
import { adminLetterDetailPage } from '../views/admin/letter-detail.js';
import type { User } from '../types.js';

const app = new Hono();

function getUser(c: Context): User {
  return c.get('user') as unknown as User;
}

app.use('*', requireAdmin);

app.get('/', (c) => {
  const letters = db.getAllLettersWithUser();
  const user = getUser(c);
  return c.html(layout('Admin', adminDashboardPage(letters), { user }));
});

app.get('/letters/:id', (c) => {
  const letter = db.getLetterByIdWithUser(c.req.param('id'));
  if (!letter) {
    return c.redirect('/admin');
  }
  const user = getUser(c);
  return c.html(layout('Admin — Letter', adminLetterDetailPage(letter), { user }));
});

app.post('/letters/:id/remove', (c) => {
  const letter = db.getLetterById(c.req.param('id'));
  if (!letter) {
    return c.redirect('/admin');
  }
  db.removeLetter(letter.id);
  return c.redirect(`/admin/letters/${letter.id}`);
});

app.post('/letters/:id/delete', (c) => {
  const letter = db.getLetterById(c.req.param('id'));
  if (!letter) {
    return c.redirect('/admin');
  }
  db.hardDeleteLetter(letter.id);
  return c.redirect('/admin');
});

export default app;

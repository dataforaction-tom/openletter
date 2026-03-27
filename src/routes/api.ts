import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as db from '../lib/db.js';

const app = new Hono();

// Autosave letter
app.post('/letters/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id') as string;
    const user = c.get('user')!;
    const letter = db.getLetterById(id);

    if (!letter || letter.user_id !== user.id) {
      return c.json({ ok: false, error: 'Letter not found' }, 404);
    }

    const body = await c.req.json<{
      title?: string;
      content_md?: string;
      authors_json?: string;
    }>();

    db.updateLetter(id, {
      title: body.title,
      content_md: body.content_md,
      authors_json: body.authors_json,
    });

    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ ok: false, error: message }, 400);
  }
});

// Increment view count
app.post('/letters/:id/view', (c) => {
  const id = c.req.param('id') as string;
  db.incrementViewCount(id);
  return c.json({ ok: true });
});

export default app;

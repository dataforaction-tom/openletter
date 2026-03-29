import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as db from '../lib/db.js';
import { generateId } from '../lib/nanoid.js';
import { layout } from '../views/layout.js';
import { dashboardPage } from '../views/dashboard/index.js';
import { newLetterPage, editorPage } from '../views/dashboard/editor.js';
import { settingsPage } from '../views/dashboard/settings.js';
import { signaturesPage } from '../views/dashboard/signatures.js';
import type { Letter, LetterSettings, User } from '../types.js';

const app = new Hono();

app.use('*', authMiddleware);

function getUser(c: Context): User {
  return c.get('user') as unknown as User;
}

function isAdmin(c: Context): boolean {
  const user = getUser(c);
  return !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
}

function getOwnedLetter(c: Context, id: string): Letter | null {
  const user = getUser(c);
  const letter = db.getLetterById(id);
  if (!letter || letter.user_id !== user.id) {
    return null;
  }
  return letter;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Dashboard list
app.get('/', (c) => {
  const user = getUser(c);
  const letters = db.getLettersByUser(user.id);
  return c.html(layout('Dashboard', dashboardPage(letters), { user, isAdmin: isAdmin(c) }));
});

// New letter form
app.get('/new', (c) => {
  return c.html(layout('New Letter', newLetterPage(), { user: getUser(c), isAdmin: isAdmin(c) }));
});

// Create letter
app.post('/new', async (c) => {
  const user = getUser(c);
  const body = await c.req.parseBody();
  const title = (body['title'] as string || '').trim();
  const contentMd = (body['content_md'] as string) || '';

  if (!title) {
    return c.html(layout('New Letter', newLetterPage(), { user, isAdmin: isAdmin(c) }));
  }

  let slug = slugify(title);
  if (!slug) {
    slug = 'letter';
  }

  // Check slug uniqueness
  if (db.getLetterBySlug(slug)) {
    const suffix = generateId(4);
    slug = `${slug}-${suffix}`.slice(0, 64);
  }

  const id = generateId();
  db.createLetter(id, user.id, slug, title, contentMd);

  return c.redirect(`/dashboard/${id}`);
});

// Edit letter
app.get('/:id', (c) => {
  const letter = getOwnedLetter(c, c.req.param('id'));
  if (!letter) {
    return c.redirect('/dashboard');
  }
  return c.html(
    layout('Edit Letter', editorPage(letter), {
      user: getUser(c),
      scripts: ['/js/modal.js', '/js/editor.js'],
      isAdmin: isAdmin(c),
    })
  );
});

// Save letter
app.post('/:id', async (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  const body = await c.req.parseBody();
  const title = (body['title'] as string) || letter.title;
  const contentMd = body['content_md'] as string | undefined;
  const authorsJson = body['authors_json'] as string | undefined;

  db.updateLetter(id, {
    title,
    content_md: contentMd,
    authors_json: authorsJson,
  });

  return c.redirect(`/dashboard/${id}`);
});

// Toggle publish status
app.post('/:id/publish', (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  if (letter.status === 'draft') {
    db.publishLetter(id);
  } else if (letter.status === 'published') {
    db.unpublishLetter(id);
  } else if (letter.status === 'closed') {
    db.publishLetter(id);
  }

  return c.redirect(`/dashboard/${id}`);
});

// Delete letter
app.post('/:id/delete', (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  db.deleteLetter(id);
  return c.redirect('/dashboard');
});

// Settings form
app.get('/:id/settings', (c) => {
  const letter = getOwnedLetter(c, c.req.param('id'));
  if (!letter) {
    return c.redirect('/dashboard');
  }
  return c.html(
    layout('Letter Settings', settingsPage(letter), { user: getUser(c), isAdmin: isAdmin(c) })
  );
});

// Save settings
app.post('/:id/settings', async (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  const body = await c.req.parseBody();

  const fieldOrganisation = (body['field_organisation'] as string) || 'optional';
  const fieldRole = (body['field_role'] as string) || 'optional';
  const fieldLocation = (body['field_location'] as string) || 'hidden';
  const fieldComment = (body['field_comment'] as string) || 'hidden';

  const settings: LetterSettings = {
    require_verification: body['require_verification'] === '1',
    show_signature_count: body['show_signature_count'] === '1',
    show_view_count: body['show_view_count'] === '1',
    show_signatories: body['show_signatories'] === '1',
    allow_comments: fieldComment === 'optional',
    fields: {
      name: 'required',
      email: 'required',
      organisation: fieldOrganisation as 'required' | 'optional' | 'hidden',
      role: fieldRole as 'required' | 'optional' | 'hidden',
      location: fieldLocation as 'required' | 'optional' | 'hidden',
    },
  };

  db.updateLetterSettings(id, JSON.stringify(settings));

  const description = (body['description'] as string) || '';
  db.updateLetterDescription(id, description);

  const closingDate = (body['closing_date'] as string) || null;
  db.updateLetterClosingDate(id, closingDate);

  return c.redirect(`/dashboard/${id}/settings`);
});

// Signatures list
app.get('/:id/signatures', (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  const filter = (c.req.query('filter') || 'all') as 'all' | 'verified' | 'pending';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const perPage = 50;

  const signatures = db.getSignaturesByLetter(letter.id, { filter, page, perPage });
  const stats = db.getSignatureCount(letter.id);
  const totalPages = db.getSignaturesTotalPages(letter.id, filter, perPage);

  return c.html(
    layout('Signatures', signaturesPage(letter, signatures, filter, page, totalPages, stats), {
      user: getUser(c),
      scripts: ['/js/modal.js'],
      isAdmin: isAdmin(c),
    })
  );
});

// Delete signature
app.post('/:id/signatures/:sid/delete', (c) => {
  const id = c.req.param('id');
  const sid = c.req.param('sid');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  db.deleteSignature(sid, letter.id);
  return c.redirect(`/dashboard/${id}/signatures`);
});

// Export signatures as CSV
app.get('/:id/signatures/export', (c) => {
  const id = c.req.param('id');
  const letter = getOwnedLetter(c, id);
  if (!letter) {
    return c.redirect('/dashboard');
  }

  const signatures = db.getAllSignaturesForExport(letter.id);

  const csvRows: string[] = ['Name,Email,Organisation,Role,Location,Comment,Verified,Date'];
  for (const sig of signatures) {
    csvRows.push(
      [
        csvEscape(sig.name),
        csvEscape(sig.email),
        csvEscape(sig.organisation || ''),
        csvEscape(sig.role || ''),
        csvEscape(sig.location || ''),
        csvEscape(sig.comment || ''),
        sig.verified ? 'Yes' : 'No',
        sig.created_at,
      ].join(',')
    );
  }

  const csv = csvRows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${letter.slug}-signatures.csv"`,
    },
  });
});

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export default app;

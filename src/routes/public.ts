import { Hono } from 'hono';
import * as db from '../lib/db.js';
import { generateId, generateToken } from '../lib/nanoid.js';
import { hashIP } from '../lib/hash.js';
import { sendVerificationEmail } from '../lib/email.js';
import { layout } from '../views/layout.js';
import { publicLetterPage } from '../views/letter/public.js';
import { signedPage } from '../views/letter/signed.js';
import type { LetterSettings } from '../types.js';

const app = new Hono();

// Public letter page
app.get('/l/:slug', (c) => {
  const slug = c.req.param('slug');
  const letter = db.getLetterBySlug(slug);

  if (!letter || letter.status === 'draft') {
    return c.notFound();
  }

  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const signatures = db.getSignaturesByLetter(letter.id, {
    filter: 'verified',
    page,
    perPage: 50,
  });
  const totalPages = db.getSignaturesTotalPages(letter.id, 'verified', 50);

  const verified = c.req.query('verified') === '1';
  const alreadySigned = c.req.query('already') === '1';

  const content = publicLetterPage(letter, signatures, page, totalPages, {
    verified,
    alreadySigned,
  });

  return c.html(
    layout(letter.title, content, {
      scripts: ['/js/modal.js'],
      description: letter.description || undefined,
      slug: letter.slug,
    })
  );
});

// Submit signature
app.post('/l/:slug/sign', async (c) => {
  const slug = c.req.param('slug');
  const letter = db.getLetterBySlug(slug);

  if (!letter || letter.status === 'draft') {
    return c.notFound();
  }

  // Check if closed
  const isClosed =
    letter.status === 'closed' ||
    (letter.closing_date && new Date(letter.closing_date) < new Date());
  if (isClosed) {
    return c.redirect(`/l/${slug}`);
  }

  const body = await c.req.parseBody();

  // Honeypot check
  if (body['website']) {
    return c.redirect(`/l/${slug}`);
  }

  const name = ((body['name'] as string) || '').trim();
  const email = ((body['email'] as string) || '').trim().toLowerCase();
  const organisation = ((body['organisation'] as string) || '').trim() || undefined;
  const role = ((body['role'] as string) || '').trim() || undefined;
  const location = ((body['location'] as string) || '').trim() || undefined;
  const comment = ((body['comment'] as string) || '').trim() || undefined;

  // Validate required fields
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.redirect(`/l/${slug}`);
  }

  const settings: LetterSettings = JSON.parse(letter.settings_json);

  // Validate settings-required fields
  if (settings.fields.organisation === 'required' && !organisation) {
    return c.redirect(`/l/${slug}`);
  }
  if (settings.fields.role === 'required' && !role) {
    return c.redirect(`/l/${slug}`);
  }
  if (settings.fields.location === 'required' && !location) {
    return c.redirect(`/l/${slug}`);
  }

  // Check for existing signature
  const existing = db.getSignatureByEmail(letter.id, email);
  if (existing) {
    return c.redirect(`/l/${slug}?already=1`);
  }

  const token = generateToken();
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '0.0.0.0';
  const ipHash = hashIP(ip);

  db.createSignature({
    id: generateId(),
    letter_id: letter.id,
    name,
    email,
    organisation,
    role,
    location,
    comment,
    verification_token: token,
    ip_hash: ipHash,
  });

  if (settings.require_verification) {
    await sendVerificationEmail(email, name, letter.title, token);
    return c.redirect(`/l/${slug}/signed?email=${encodeURIComponent(email)}`);
  } else {
    // Auto-verify if verification not required
    db.verifySignature(token);
    return c.redirect(`/l/${slug}/signed?email=${encodeURIComponent(email)}&verified=1`);
  }
});

// Signed confirmation page
app.get('/l/:slug/signed', (c) => {
  const slug = c.req.param('slug');
  const letter = db.getLetterBySlug(slug);

  if (!letter) {
    return c.notFound();
  }

  const email = c.req.query('email') || '';
  const verified = c.req.query('verified') === '1';
  const title = verified ? 'Thank you' : 'Check your email';

  return c.html(layout(title, signedPage(letter, email, verified)));
});

// Verify signature
app.get('/verify/:token', (c) => {
  const token = c.req.param('token');
  const signature = db.getSignatureByToken(token);

  if (!signature) {
    return c.redirect('/');
  }

  db.verifySignature(token);
  return c.redirect(`/l/${signature.letter_slug}?verified=1`);
});

export default app;

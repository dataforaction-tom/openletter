# OpenLetter Platform Specification

**Version:** 2.0  
**Status:** Ready for build  
**Target:** Self-hostable open source platform for creating and managing open letters

---

## Overview

OpenLetter is a platform where users can create public open letters, collect verified signatures, and share them. It can be self-hosted by organisations wanting their own instance, or run as a multi-tenant SaaS.

**Core user journey:**
1. Sign up with email (magic link, no passwords)
2. Create a letter with markdown editor
3. Configure signature fields and settings
4. Share public link
5. Manage signatures from dashboard

---

## Principles

1. **Radically simple deployment** — `docker compose up` and you're live
2. **Zero external dependencies** — SQLite database, no cloud accounts required
3. **Privacy-conscious** — Emails visible only to letter owners, never exported by default
4. **Beautiful by default** — Editorial design that makes letters feel important
5. **Forkable** — Clean code, minimal dependencies, easy to understand and modify
6. **No build step** — Vanilla HTML/CSS/JS, edit and refresh

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Server** | Hono | Lightweight, fast, runs anywhere, great DX |
| **Database** | SQLite (better-sqlite3) | Zero config, single file, easy backup |
| **Auth** | Custom magic link | Simple token-based, no passwords |
| **Frontend** | Server-rendered HTML + vanilla CSS/JS | No build step, fast, easy to modify |
| **Editor** | Textarea + marked.js preview | Simple, no dependencies |
| **Email** | Resend (pluggable) | 100/day free, clean API |
| **Hosting** | Docker | Single container, runs anywhere |

### Why This Stack?

**Benefits:**
- **Truly self-contained** — One Docker image, one SQLite file
- **No accounts needed** — No Supabase, no Vercel, no cloud signups
- **Easy to understand** — Read the code in an afternoon
- **Easy to modify** — Change HTML directly, refresh browser
- **Easy to backup** — Copy one `.db` file
- **Runs anywhere** — Raspberry Pi to cloud VM

**Avoided:**
- React/Next.js — Overkill, adds build complexity
- Postgres — Requires separate service
- ORMs — Direct SQL is clearer for this scale
- Component libraries — Vanilla CSS is enough

---

## Database Schema (SQLite)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- nanoid
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Auth tokens (magic links)
CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,  -- nanoid
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,  -- for signup tokens where user doesn't exist yet
  token TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'signup')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- nanoid, used as cookie value
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Letters
CREATE TABLE letters (
  id TEXT PRIMARY KEY,  -- nanoid
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identity
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content
  content_md TEXT NOT NULL DEFAULT '',
  
  -- Authors JSON: [{"name": "Jane Smith", "org": "Example Org"}]
  authors_json TEXT DEFAULT '[]',
  
  -- Settings JSON
  settings_json TEXT DEFAULT '{
    "require_verification": true,
    "show_signature_count": true,
    "show_view_count": true,
    "show_signatories": true,
    "allow_comments": false,
    "fields": {
      "name": "required",
      "email": "required",
      "organisation": "optional",
      "role": "optional",
      "location": "hidden"
    }
  }',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  closing_date TEXT,
  
  -- Stats (denormalized)
  signature_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  published_at TEXT
);

-- Signatures
CREATE TABLE signatures (
  id TEXT PRIMARY KEY,  -- nanoid
  letter_id TEXT REFERENCES letters(id) ON DELETE CASCADE NOT NULL,
  
  -- Signer info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  location TEXT,
  comment TEXT,
  
  -- Verification
  verified INTEGER DEFAULT 0,
  verification_token TEXT,
  
  -- Metadata
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  verified_at TEXT,
  
  -- One signature per email per letter
  UNIQUE(letter_id, email)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX idx_sessions_id ON sessions(id);
CREATE INDEX idx_letters_user ON letters(user_id);
CREATE INDEX idx_letters_slug ON letters(slug);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_signatures_letter ON signatures(letter_id);
CREATE INDEX idx_signatures_verified ON signatures(letter_id, verified);
CREATE INDEX idx_signatures_token ON signatures(verification_token);
```

---

## Auth Flow (Magic Link)

Simple token-based authentication, no passwords.

### Signup/Login Flow

1. User enters email at `/login`
2. Server creates `auth_token` record with:
   - Random token (32 char nanoid)
   - Expiry (1 hour from now)
   - Type: `signup` (new email) or `login` (existing user)
3. Server sends email with link: `/auth/verify?token=xxx`
4. User clicks link
5. Server validates token (exists, not expired, not used)
6. If signup: create user record
7. Create session record with:
   - Random session ID (32 char nanoid)
   - Expiry (30 days from now)
8. Set `session` cookie (httpOnly, secure, sameSite=lax)
9. Mark token as used
10. Redirect to `/dashboard`

### Session Validation

Every protected route:
1. Read `session` cookie
2. Look up session in database
3. Check not expired
4. If valid: attach `user` to request context
5. If invalid: redirect to `/login`

### Logout

1. Delete session from database
2. Clear cookie
3. Redirect to `/`

---

## Page Structure

```
/                           Landing page
/login                      Email input, send magic link
/auth/verify                Verify token, create session
/logout                     Clear session, redirect

/dashboard                  List user's letters
/dashboard/new              Create new letter
/dashboard/[id]             Edit letter content
/dashboard/[id]/settings    Letter settings
/dashboard/[id]/signatures  View/manage signatures

/l/[slug]                   Public letter page
/l/[slug]/signed            Post-signature confirmation
/verify/[token]             Verify signature email
```

---

## Features by Page

### Landing Page (`/`)

Server-rendered HTML. No JS required.

- Hero: "Create open letters that matter"
- How it works: 3 steps (icons + text)
- Example letters (curated or recent public)
- CTA: "Create your letter" → `/login`
- Footer with links

### Login (`/login`)

Server-rendered form.

```html
<form method="POST" action="/login">
  <input type="email" name="email" required>
  <button type="submit">Send magic link</button>
</form>
```

On POST:
- Validate email format
- Create/send magic link
- Show "Check your email" message (same page, different state)

### Auth Verify (`/auth/verify?token=xxx`)

No UI needed, just logic:
- Validate token
- Create user if new
- Create session
- Set cookie
- Redirect to `/dashboard`
- On error: redirect to `/login?error=invalid`

### Dashboard (`/dashboard`)

Server-rendered. Requires auth.

- Header with user email, logout link
- "New letter" button
- List of letters as cards:
  - Title
  - Status badge (draft/published/closed)
  - Signature count
  - Created date
  - Click → `/dashboard/[id]`
- Empty state if no letters

### Create Letter (`/dashboard/new`)

Server-rendered form + minimal JS for preview.

```html
<form method="POST" action="/dashboard/new">
  <input type="text" name="title" placeholder="Letter title" required>
  <textarea name="content_md" id="editor"></textarea>
  <div id="preview"></div>
  <button type="submit">Create draft</button>
</form>
```

JS handles:
- Live markdown preview (debounced)
- That's it

On POST:
- Generate slug from title
- Create letter record
- Redirect to `/dashboard/[id]`

### Edit Letter (`/dashboard/[id]`)

Server-rendered form + JS for preview and autosave.

**Layout:**
- Title input
- Two-column: editor (left) + preview (right)
- Authors section (add/remove)
- Action buttons: Save, Preview, Publish/Unpublish

**JS handles:**
- Live markdown preview
- Autosave (debounced POST to `/api/letters/[id]`)
- Add/remove authors (DOM manipulation)

**Forms submit to:**
- `POST /dashboard/[id]` — Save changes
- `POST /dashboard/[id]/publish` — Change status
- `POST /dashboard/[id]/delete` — Delete (with confirmation)

### Letter Settings (`/dashboard/[id]/settings`)

Server-rendered form.

- Description (for SEO/social)
- Field toggles (required/optional/hidden):
  - Organisation
  - Role
  - Location
  - Comment
- Require email verification (checkbox)
- Show signature count (checkbox)
- Show view count (checkbox)
- Show signatories (checkbox)
- Closing date (date input)
- Save button

### Signatures Management (`/dashboard/[id]/signatures`)

Server-rendered table + minimal JS for UX.

- Stats row: total, verified, pending
- Filter links: All | Verified | Pending
- Table:
  - Name
  - Email (visible to owner)
  - Organisation
  - Status badge
  - Date
  - Delete button (form with confirmation)
- Pagination (server-side)
- Export CSV link

**JS handles:**
- Delete confirmation modal
- That's it (no client-side filtering)

### Public Letter (`/l/[slug]`)

Server-rendered. No auth required.

**Structure:**
```html
<header>
  <span class="label">Open Letter</span>
  <div class="stats">X signatures · Y views</div>
</header>

<article>
  <h1>Title</h1>
  <p class="authors">By Jane Smith, Example Org</p>
  <time>Published January 1, 2025</time>
  
  <div class="content">
    <!-- Rendered markdown -->
  </div>
</article>

<section class="cta">
  <p><strong>X people</strong> have signed</p>
  <button id="btn-sign">Add your name</button>
</section>

<section class="signatories">
  <h2>Signatories</h2>
  <ul>
    <li>Name, Organisation</li>
    <!-- ... -->
  </ul>
  <a href="?page=2">Load more</a>
</section>

<!-- Sign modal (hidden by default) -->
<dialog id="sign-modal">
  <form method="POST" action="/l/[slug]/sign">
    <input name="name" required>
    <input name="email" type="email" required>
    <input name="organisation">
    <!-- etc based on settings -->
    <button type="submit">Sign</button>
  </form>
</dialog>
```

**JS handles:**
- Open/close modal
- Form validation feedback
- That's it

On form POST:
- Validate inputs
- Check for existing signature
- Create signature record
- Send verification email
- Redirect to `/l/[slug]/signed`

### Post-Signature (`/l/[slug]/signed`)

Simple confirmation page:
- "Check your email"
- "We've sent a verification link to [email]"
- Link back to letter

### Verify Signature (`/verify/[token]`)

No UI, just logic:
- Look up signature by token
- If valid: mark verified, update count, redirect to `/l/[slug]?verified=1`
- If invalid: redirect to letter with error

---

## Routes (Hono)

All routes return HTML unless noted. API routes return JSON.

### Public Routes

```
GET  /                      Landing page
GET  /login                 Login form
POST /login                 Send magic link, show confirmation
GET  /auth/verify           Verify token, create session, redirect
GET  /logout                Clear session, redirect to /

GET  /l/:slug               Public letter page
POST /l/:slug/sign          Submit signature, redirect to /l/:slug/signed
GET  /l/:slug/signed        Confirmation page
GET  /verify/:token         Verify signature, redirect to letter
```

### Protected Routes (require session)

```
GET  /dashboard             List user's letters
GET  /dashboard/new         Create letter form
POST /dashboard/new         Create letter, redirect to edit

GET  /dashboard/:id         Edit letter form
POST /dashboard/:id         Save letter changes
POST /dashboard/:id/publish Toggle publish status
POST /dashboard/:id/delete  Delete letter, redirect to dashboard

GET  /dashboard/:id/settings     Settings form
POST /dashboard/:id/settings     Save settings

GET  /dashboard/:id/signatures   Signatures table
POST /dashboard/:id/signatures/:sid/delete  Delete signature
GET  /dashboard/:id/signatures/export       CSV download
```

### API Routes (JSON, for JS interactions)

```
POST /api/letters/:id       Autosave letter (returns {ok: true})
POST /api/letters/:id/view  Increment view count (called from public page)
```

---

## Email Templates

### Magic Link Login
```
Subject: Sign in to OpenLetter

Click to sign in:
[Sign in button]

Or copy this link: {url}

This link expires in 1 hour.

If you didn't request this, ignore this email.
```

### Signature Verification
```
Subject: Verify your signature on "{letter_title}"

Hi {name},

Please verify your signature on the open letter "{letter_title}".

[Verify my signature button]

Or copy this link: {url}

If you didn't sign this letter, ignore this email.
```

### Signature Confirmed (optional)
```
Subject: You signed "{letter_title}"

Hi {name},

Your signature on "{letter_title}" has been verified.

View the letter: {url}

Thank you for adding your voice.
```

---

## Design System

### Typography
```css
--font-display: 'Instrument Serif', Georgia, serif;
--font-body: 'Source Sans 3', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Colors (Light theme)
```css
--ink: #1a1a1a;
--ink-light: #4a4a4a;
--ink-muted: #8a8a8a;
--paper: #fafaf8;
--paper-warm: #f5f4f0;
--border: #e5e4e0;
--accent: #2d5a27;
--accent-light: #e8f0e7;
--error: #c53030;
--success: #2d5a27;
```

### Spacing
```css
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;
--space-2xl: 3rem;
--space-3xl: 4rem;
```

### Components to build

**Buttons:**
- Primary (dark bg, light text)
- Secondary (border, transparent bg)
- Ghost (no border)
- Icon button

**Form elements:**
- Text input
- Textarea
- Select
- Checkbox/toggle
- Radio group

**Cards:**
- Letter card (for dashboard)
- Stat card

**Modal:**
- Backdrop + centered content
- Close button
- Accessible (focus trap, escape to close)

**Toast notifications:**
- Success (green)
- Error (red)
- Info (neutral)

**Tables:**
- Header row
- Sortable columns
- Row actions
- Pagination

**Editor:**
- Toolbar
- Markdown input
- Preview pane

---

## Deployment

### Docker (Recommended)

**One command:**
```bash
docker run -d \
  -p 3000:3000 \
  -v openletter-data:/data \
  -e RESEND_API_KEY=your-key \
  -e APP_URL=https://letters.example.com \
  ghcr.io/yourusername/openletter
```

**With docker-compose:**
```yaml
# docker-compose.yml
services:
  openletter:
    image: ghcr.io/yourusername/openletter
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - APP_URL=https://letters.example.com
      - RESEND_API_KEY=${RESEND_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
    restart: unless-stopped
```

```bash
docker compose up -d
```

Data persists in `./data/openletter.db`.

### Run Locally (Development)

```bash
git clone https://github.com/yourusername/openletter
cd openletter
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Environment Variables

```bash
# Required
APP_URL=http://localhost:3000      # Your public URL
SESSION_SECRET=random-32-char-string

# Email (pick one)
RESEND_API_KEY=re_xxx              # resend.com API key

# Optional
PORT=3000                          # Server port
DATA_DIR=/data                     # SQLite database location
```

### Free Hosting Options

**Fly.io:**
```bash
fly launch
fly secrets set RESEND_API_KEY=xxx SESSION_SECRET=xxx
fly deploy
```
Free tier: 3 shared VMs, 3GB storage.

**Railway:**
- Connect GitHub repo
- Add environment variables
- Auto-deploys on push
Free tier: $5/month credit.

**Render:**
- Connect GitHub repo
- Select "Web Service"
- Add environment variables
Free tier: Spins down after 15min inactivity.

**Self-hosted:**
Any VPS with Docker. $5/month on DigitalOcean, Hetzner, etc.

---

## File Structure

```
openletter/
├── src/
│   ├── index.ts                 # Hono app entry point
│   ├── routes/
│   │   ├── public.ts            # Landing, login, public letter
│   │   ├── auth.ts              # Magic link verification
│   │   ├── dashboard.ts         # Dashboard routes (protected)
│   │   └── api.ts               # JSON API routes
│   ├── middleware/
│   │   ├── auth.ts              # Session validation
│   │   └── error.ts             # Error handling
│   ├── lib/
│   │   ├── db.ts                # SQLite connection + queries
│   │   ├── email.ts             # Email sending (Resend)
│   │   ├── nanoid.ts            # ID generation
│   │   ├── hash.ts              # IP hashing
│   │   └── markdown.ts          # Markdown rendering
│   ├── views/
│   │   ├── layout.ts            # Base HTML layout
│   │   ├── components.ts        # Reusable HTML components
│   │   ├── landing.ts           # Landing page
│   │   ├── login.ts             # Login page
│   │   ├── dashboard/
│   │   │   ├── index.ts         # Letters list
│   │   │   ├── editor.ts        # Edit letter
│   │   │   ├── settings.ts      # Letter settings
│   │   │   └── signatures.ts    # Signatures table
│   │   └── letter/
│   │       ├── public.ts        # Public letter page
│   │       └── signed.ts        # Confirmation page
│   └── types.ts                 # TypeScript types
├── public/
│   ├── css/
│   │   └── style.css            # All styles (single file)
│   ├── js/
│   │   ├── app.js               # Shared utilities
│   │   ├── editor.js            # Markdown preview + autosave
│   │   └── modal.js             # Modal interactions
│   └── fonts/                   # Self-hosted fonts (optional)
├── data/                        # SQLite database (gitignored)
│   └── openletter.db
├── scripts/
│   └── migrate.ts               # Database migrations
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### View Functions

Views are functions that return HTML strings. No templating engine needed.

```typescript
// src/views/layout.ts
export function layout(title: string, content: string, user?: User) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - OpenLetter</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${user ? navBar(user) : ''}
  <main>${content}</main>
  <script src="/js/app.js"></script>
</body>
</html>`;
}

// src/views/components.ts
export function button(text: string, attrs: Record<string, string> = {}) {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<button ${attrStr}>${text}</button>`;
}

export function letterCard(letter: Letter) {
  return `
    <a href="/dashboard/${letter.id}" class="letter-card">
      <h3>${escapeHtml(letter.title)}</h3>
      <span class="badge badge-${letter.status}">${letter.status}</span>
      <p>${letter.signature_count} signatures</p>
    </a>
  `;
}
```

### Route Example

```typescript
// src/routes/dashboard.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { layout } from '../views/layout';
import { dashboardPage } from '../views/dashboard';
import { db } from '../lib/db';

const app = new Hono();

app.use('/*', authMiddleware);

app.get('/', (c) => {
  const user = c.get('user');
  const letters = db.getLettersByUser(user.id);
  return c.html(layout('Dashboard', dashboardPage(letters), user));
});

export default app;
```

---

## Implementation Order

### Phase 1: Foundation (Day 1 morning)
1. [ ] Project setup: `npm init`, TypeScript, Hono
2. [ ] SQLite setup with better-sqlite3
3. [ ] Database schema + migration script
4. [ ] Basic Hono app with static file serving
5. [ ] CSS foundation: variables, typography, reset

### Phase 2: Auth (Day 1 afternoon)
6. [ ] Login page (HTML form)
7. [ ] Magic link sending (Resend integration)
8. [ ] Token verification route
9. [ ] Session creation + cookie handling
10. [ ] Auth middleware for protected routes
11. [ ] Logout route

### Phase 3: Dashboard CRUD (Day 2 morning)
12. [ ] Dashboard layout (nav, container)
13. [ ] Letters list page
14. [ ] Create letter form + route
15. [ ] Edit letter page (basic, no preview yet)
16. [ ] Delete letter with confirmation
17. [ ] Settings page

### Phase 4: Editor (Day 2 afternoon)
18. [ ] Markdown preview (client-side marked.js)
19. [ ] Two-column editor layout
20. [ ] Autosave via fetch POST
21. [ ] Authors add/remove UI

### Phase 5: Public Pages (Day 3 morning)
22. [ ] Public letter page (`/l/:slug`)
23. [ ] Rendered markdown with editorial styling
24. [ ] Sign modal (HTML dialog)
25. [ ] Signature form submission
26. [ ] Verification email sending
27. [ ] Verification route
28. [ ] Signatories list with pagination

### Phase 6: Signatures Management (Day 3 afternoon)
29. [ ] Signatures table page
30. [ ] Filter by status (query params)
31. [ ] Delete signature
32. [ ] CSV export
33. [ ] Publish/unpublish flow

### Phase 7: Polish (Day 4)
34. [ ] Landing page
35. [ ] Email templates (nice HTML)
36. [ ] Error pages (404, 500)
37. [ ] Toast/flash messages
38. [ ] Mobile responsive tweaks
39. [ ] Loading states
40. [ ] Form validation feedback

### Phase 8: Deployment (Day 4)
41. [ ] Dockerfile
42. [ ] docker-compose.yml
43. [ ] Environment variable docs
44. [ ] README with setup instructions
45. [ ] GitHub Actions for Docker build

---

## Nice-to-haves (Post-MVP)

- Custom domains per letter
- Letter templates (pre-written starting points)
- Embed widget (sign form on external sites)
- Scheduled publishing
- Signature milestones (notify owner at 100, 1000, etc.)
- Social sharing cards (og:image generation)
- Analytics (signature sources, geography)
- Webhooks (notify external systems on signature)
- API keys for programmatic access
- Teams/organisations (multiple users managing same letters)
- White-label (remove OpenLetter branding)
- Import existing signatures (CSV)
- Signature badges/certificates (downloadable)

---

## Security Considerations

1. **Rate limiting** — Sign endpoint should be rate limited (10/min per IP)
2. **Email verification** — Required by default, tokens expire after 24h
3. **CSRF protection** — Next.js handles this for API routes
4. **Row Level Security** — Postgres policies enforce access control
5. **Email privacy** — Never exposed in public API responses
6. **IP hashing** — Store hash only, not raw IP
7. **Honeypot** — Hidden field to catch bots
8. **Input validation** — Zod schemas for all inputs
9. **XSS prevention** — Sanitize markdown rendering
10. **SQL injection** — Parameterized queries via Supabase client

---

## Testing Notes

**Key flows to test:**
1. Sign up → receive magic link → click → logged in
2. Create letter → edit → publish → view public page
3. Sign letter → receive verification email → click → signature appears
4. Owner views all signatures including emails
5. Public only sees verified signatures, no emails
6. Delete signature → count updates
7. Close letter → can no longer sign
8. CSV export includes/excludes emails based on toggle

---

## Questions Resolved

1. **Editor:** Plain `<textarea>` + marked.js for preview. Simple, no dependencies.
2. **Styling:** Vanilla CSS, no Tailwind. Single `style.css` file.
3. **Email:** Resend for all emails (100/day free). Easy to swap.
4. **Image uploads:** Deferred. Markdown image URLs work for now.
5. **Framework:** Hono. Lightweight, fast, great TypeScript support.
6. **Database:** SQLite via better-sqlite3. Zero external dependencies.

---

## Dependencies

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "better-sqlite3": "^11.0.0",
    "marked": "^12.0.0",
    "resend": "^3.0.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

Total: 5 runtime dependencies. No build step for frontend.

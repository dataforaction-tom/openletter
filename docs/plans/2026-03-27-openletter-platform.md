# OpenLetter Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-hostable open letter platform with magic link auth, markdown editor, signature collection, and Docker deployment.

**Architecture:** Hono server with SQLite (better-sqlite3), server-rendered HTML views as TypeScript template functions, vanilla CSS/JS frontend. No build step for frontend. Single Docker container.

**Tech Stack:** Hono, better-sqlite3, marked.js, Resend, nanoid, TypeScript (server), vanilla HTML/CSS/JS (client)

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize package.json**

```json
{
  "name": "openletter",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "migrate": "tsx scripts/migrate.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "better-sqlite3": "^11.0.0",
    "hono": "^4.0.0",
    "marked": "^12.0.0",
    "nanoid": "^5.0.0",
    "resend": "^3.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist", "data"]
}
```

**Step 3: Create .env.example**

```
APP_URL=http://localhost:3000
SESSION_SECRET=change-me-to-a-random-32-char-string
RESEND_API_KEY=re_xxx
PORT=3000
DATA_DIR=./data
```

**Step 4: Update .gitignore**

```
node_modules/
dist/
data/
.env
*.db
```

**Step 5: Install dependencies**

Run: `npm install`
Expected: node_modules created, package-lock.json generated

**Step 6: Create directory structure**

```bash
mkdir -p src/routes src/middleware src/lib src/views/dashboard src/views/letter public/css public/js data scripts
```

**Step 7: Commit**

```bash
git init && git add -A && git commit -m "chore: initial project setup with Hono + SQLite stack"
```

---

## Task 2: Core Libraries

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/nanoid.ts`
- Create: `src/lib/hash.ts`
- Create: `src/lib/markdown.ts`
- Create: `src/lib/email.ts`

**Step 1: Create TypeScript types**

File `src/types.ts` — Define interfaces for User, AuthToken, Session, Letter, Signature matching the DB schema. Include `LetterSettings` and `Author` types for the JSON fields.

**Step 2: Create nanoid helper**

File `src/lib/nanoid.ts` — Export `generateId(size?: number)` that returns a nanoid. Default size 21, with a `generateToken()` that returns size 32 for auth tokens.

**Step 3: Create IP hash helper**

File `src/lib/hash.ts` — Export `hashIP(ip: string)` using Node crypto `createHash('sha256')`. One-way hash, never store raw IP.

**Step 4: Create markdown renderer**

File `src/lib/markdown.ts` — Export `renderMarkdown(md: string)` using `marked`. Configure marked with `{ breaks: true, gfm: true }`. Also export `escapeHtml(str: string)` for template safety.

**Step 5: Create email module**

File `src/lib/email.ts` — Export `sendMagicLink(email, token, type)` and `sendVerificationEmail(email, name, letterTitle, token)`. Use Resend SDK. Read `RESEND_API_KEY` and `APP_URL` from env. Include a dev-mode fallback that logs to console when no API key is set.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add core libraries — nanoid, hash, markdown, email"
```

---

## Task 3: Database Setup

**Files:**
- Create: `src/lib/db.ts`
- Create: `scripts/migrate.ts`

**Step 1: Create database module**

File `src/lib/db.ts`:
- Initialize better-sqlite3 with path from `DATA_DIR` env var (default `./data/openletter.db`)
- Enable WAL mode for performance
- Create all tables from SPEC schema (users, auth_tokens, sessions, letters, signatures) using `db.exec()`
- Create all indexes from SPEC
- Export query functions grouped by entity:
  - **Users:** `getUserById`, `getUserByEmail`, `createUser`
  - **Auth:** `createAuthToken`, `getAuthToken`, `markTokenUsed`
  - **Sessions:** `createSession`, `getSession`, `deleteSession`, `deleteExpiredSessions`
  - **Letters:** `getLettersByUser`, `getLetterById`, `getLetterBySlug`, `createLetter`, `updateLetter`, `updateLetterSettings`, `deleteLetter`, `publishLetter`, `closeLetter`, `incrementViewCount`
  - **Signatures:** `getSignaturesByLetter` (with pagination + filter), `getSignatureCount`, `createSignature`, `verifySignature`, `deleteSignature`, `getSignatureByToken`, `getSignatureByEmail`

Each function uses parameterized queries (prepared statements via better-sqlite3).

**Step 2: Create migration script**

File `scripts/migrate.ts` — Runs the schema creation. Idempotent with `IF NOT EXISTS`. This is called by `npm run migrate` and also by db.ts on first import.

**Step 3: Test database locally**

Run: `npm run migrate`
Expected: `data/openletter.db` created with all tables

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add SQLite database with schema and query functions"
```

---

## Task 4: CSS Foundation

**Files:**
- Create: `public/css/style.css`

**Step 1: Write the complete stylesheet**

Single file with all styles. Sections:
1. **CSS Reset** — Minimal reset (box-sizing, margins, font smoothing)
2. **Custom Properties** — All design tokens from SPEC (typography, colors, spacing)
3. **Base Typography** — Body, headings h1-h6, links, paragraphs, lists
4. **Layout** — `.container`, `.grid`, `.stack`, main content widths
5. **Navigation** — Top nav bar, user menu, nav links
6. **Buttons** — `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.btn-danger`
7. **Forms** — Input, textarea, select, checkbox/toggle, labels, field groups, validation states
8. **Cards** — `.letter-card` for dashboard, `.stat-card`
9. **Badges** — `.badge`, `.badge-draft`, `.badge-published`, `.badge-closed`, `.badge-verified`, `.badge-pending`
10. **Tables** — Responsive table, header, rows, pagination
11. **Modal/Dialog** — `dialog` styling, backdrop, close button
12. **Toast** — `.toast`, `.toast-success`, `.toast-error`, `.toast-info`, slide-in animation
13. **Editor** — Two-column layout, toolbar, preview pane
14. **Public Letter** — Editorial article styling, signature CTA section, signatories list
15. **Landing Page** — Hero, features grid, CTA sections
16. **Utility Classes** — `.sr-only`, `.text-muted`, `.text-center`, `.mt-*`, `.mb-*`
17. **Responsive** — Media queries for tablet and mobile

Use Google Fonts links for Instrument Serif, Source Sans 3 (loaded in layout.ts `<head>`).

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add complete CSS design system"
```

---

## Task 5: Views — Layout and Components

**Files:**
- Create: `src/views/layout.ts`
- Create: `src/views/components.ts`

**Step 1: Create base layout**

File `src/views/layout.ts`:
- Export `layout(title, content, options?)` — Full HTML document with `<head>` (meta, fonts, CSS), optional nav bar when user is logged in, `<main>` wrapper, flash message display, `<script>` tags
- Export `navBar(user)` — Top nav with logo link, dashboard link, user email, logout link
- Options object: `{ user?, scripts?: string[], description?, slug? }` for page-specific needs (og tags, extra JS)

**Step 2: Create reusable components**

File `src/views/components.ts`:
- `escapeHtml(str)` — Escape `<>&"'` characters
- `button(text, attrs)` — Button element builder
- `letterCard(letter)` — Dashboard card with title, status badge, signature count, date
- `statusBadge(status)` — draft/published/closed badge
- `verificationBadge(verified)` — verified/pending badge
- `emptyState(title, description, actionUrl?, actionText?)` — Empty state card
- `flashMessage(type, message)` — Toast/flash HTML
- `pagination(currentPage, totalPages, baseUrl)` — Page navigation links
- `formatDate(dateStr)` — Human-readable date formatting
- `statCard(label, value)` — Stat display card

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add HTML layout and reusable view components"
```

---

## Task 6: Auth System

**Files:**
- Create: `src/views/login.ts`
- Create: `src/middleware/auth.ts`
- Create: `src/routes/auth.ts`

**Step 1: Create login view**

File `src/views/login.ts`:
- Export `loginPage(error?, sent?)` — Shows email form OR "check your email" confirmation
- Form POSTs to `/login` with email field
- Error display for invalid/expired tokens
- Minimal, centered layout

**Step 2: Create auth middleware**

File `src/middleware/auth.ts`:
- Export `authMiddleware` — Hono middleware that:
  1. Reads `session` cookie
  2. Looks up session in DB
  3. Checks expiry
  4. Sets `user` on context via `c.set('user', user)`
  5. If invalid: redirects to `/login`
- Export `optionalAuth` — Same but doesn't redirect, just sets user if present

**Step 3: Create auth routes**

File `src/routes/auth.ts` — Hono router with:
- `GET /login` — Render login page
- `POST /login` — Validate email, create auth_token, send magic link email, render "check your email" state
- `GET /auth/verify` — Validate token from query param, create user if signup, create session, set cookie (httpOnly, secure in prod, sameSite=lax, 30 day maxAge), redirect to `/dashboard`
- `GET /logout` — Delete session from DB, clear cookie, redirect to `/`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add magic link auth system — login, verify, sessions"
```

---

## Task 7: Dashboard — Letters CRUD

**Files:**
- Create: `src/views/dashboard/index.ts`
- Create: `src/views/dashboard/editor.ts`
- Create: `src/views/dashboard/settings.ts`
- Create: `src/routes/dashboard.ts`

**Step 1: Create dashboard list view**

File `src/views/dashboard/index.ts`:
- Export `dashboardPage(letters)` — Grid of letter cards or empty state
- "New letter" button linking to `/dashboard/new`
- Each card shows title, status badge, signature count, created date, links to `/dashboard/:id`

**Step 2: Create editor view**

File `src/views/dashboard/editor.ts`:
- Export `editorPage(letter)` — Form for editing letter
- Title input field
- Two-column layout: textarea (left) + markdown preview div (right)
- Authors section: list of current authors with remove buttons, "Add author" form (name + org fields)
- Action bar: Save button, Preview link (opens `/l/:slug` in new tab), Publish/Unpublish button, Delete button
- Includes `editor.js` script
- Export `newLetterPage()` — Simpler form with just title + content for initial creation

**Step 3: Create settings view**

File `src/views/dashboard/settings.ts`:
- Export `settingsPage(letter)` — Form for letter settings
- Slug display (read-only after creation)
- Description textarea
- Field configuration: radio groups (required/optional/hidden) for organisation, role, location
- Comment field toggle
- Checkboxes: require verification, show signature count, show view count, show signatories
- Closing date input
- Save button
- Tabs/links to navigate between Edit / Settings / Signatures

**Step 4: Create dashboard routes**

File `src/routes/dashboard.ts` — Hono router, all routes use `authMiddleware`:
- `GET /dashboard` — List user's letters
- `GET /dashboard/new` — New letter form
- `POST /dashboard/new` — Create letter (generate slug from title), redirect to `/dashboard/:id`
- `GET /dashboard/:id` — Edit letter form (verify ownership)
- `POST /dashboard/:id` — Save letter changes
- `POST /dashboard/:id/publish` — Toggle publish status (draft↔published or published→closed)
- `POST /dashboard/:id/delete` — Delete letter with ownership check, redirect to `/dashboard`
- `GET /dashboard/:id/settings` — Settings form
- `POST /dashboard/:id/settings` — Save settings JSON

Slug generation: lowercase title, replace spaces with hyphens, remove non-alphanumeric, truncate to 60 chars, append random 4-char suffix if collision.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add dashboard with letter CRUD, editor, and settings"
```

---

## Task 8: Client-Side JavaScript

**Files:**
- Create: `public/js/app.js`
- Create: `public/js/editor.js`
- Create: `public/js/modal.js`

**Step 1: Create shared app utilities**

File `public/js/app.js`:
- Toast notification system: `showToast(message, type)` — creates toast element, auto-dismisses after 3s
- Flash message fade-out after 5s
- Generic `fetch` wrapper for API calls with error handling

**Step 2: Create editor script**

File `public/js/editor.js`:
- Load `marked` from CDN (add script tag in editor view)
- Live markdown preview: listen to textarea `input` event, render to preview div, debounced (300ms)
- Autosave: debounced (2s) POST to `/api/letters/:id` with title + content_md, show "Saved" toast on success
- Authors UI: "Add author" button appends name/org input row, "Remove" button removes row, collect authors as JSON array into hidden input on form submit

**Step 3: Create modal script**

File `public/js/modal.js`:
- `openModal(id)` / `closeModal(id)` — Show/hide `<dialog>` element
- Click backdrop to close
- Escape key to close
- Focus trap within modal
- Wire up sign button to open sign modal on public letter page
- Delete confirmation: intercept delete form submit, show confirm dialog

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add client-side JS — editor preview, autosave, modals"
```

---

## Task 9: Public Letter Pages

**Files:**
- Create: `src/views/letter/public.ts`
- Create: `src/views/letter/signed.ts`
- Create: `src/routes/public.ts`

**Step 1: Create public letter view**

File `src/views/letter/public.ts`:
- Export `publicLetterPage(letter, signatures, page, totalPages, verified?)` — Full public letter display
- Header: "Open Letter" label, stats (X signatures, Y views) based on letter settings
- Article: title, authors list, published date, rendered markdown content
- CTA section: "X people have signed" + "Add your name" button
- Signatories list: verified signatures with name + organisation, paginated
- Sign modal (`<dialog>`): form with fields based on letter settings (required/optional/hidden), honeypot field
- If letter is closed: show "This letter is closed for signatures" instead of sign button
- If `verified` query param: show success toast "Your signature has been verified"
- Includes `modal.js` script
- View count increment via fetch to `/api/letters/:id/view`

**Step 2: Create signed confirmation view**

File `src/views/letter/signed.ts`:
- Export `signedPage(letter, email)` — Confirmation after signing
- "Check your email" heading
- "We've sent a verification link to [partially masked email]"
- Link back to the letter

**Step 3: Create public routes**

File `src/routes/public.ts` — Hono router:
- `GET /` — Landing page
- `GET /l/:slug` — Public letter page with pagination (query param `page`)
- `POST /l/:slug/sign` — Validate inputs, check honeypot, check for existing signature, check letter is published and not closed/past closing date, create signature record, send verification email if required, redirect to `/l/:slug/signed`
- `GET /l/:slug/signed` — Confirmation page
- `GET /verify/:token` — Look up signature by verification_token, mark verified, increment letter signature_count, redirect to `/l/:slug?verified=1`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add public letter pages, signing flow, and verification"
```

---

## Task 10: Signatures Management

**Files:**
- Create: `src/views/dashboard/signatures.ts`
- Update: `src/routes/dashboard.ts` (add signature routes)

**Step 1: Create signatures view**

File `src/views/dashboard/signatures.ts`:
- Export `signaturesPage(letter, signatures, filter, page, totalPages, stats)` — Full signatures management
- Stats row: total signatures, verified count, pending count
- Filter links: All | Verified | Pending (as query param `filter=all|verified|pending`)
- Table: Name, Email (visible to owner), Organisation, Role, Status badge, Date, Delete button (form)
- Pagination
- Export CSV link
- Tabs linking to Edit / Settings / Signatures

**Step 2: Add signature routes to dashboard router**

Add to `src/routes/dashboard.ts`:
- `GET /dashboard/:id/signatures` — Signatures table with filter + pagination
- `POST /dashboard/:id/signatures/:sid/delete` — Delete signature, update letter signature_count, redirect back
- `GET /dashboard/:id/signatures/export` — Generate CSV (name, email, organisation, role, location, comment, verified, date), set `Content-Type: text/csv` and `Content-Disposition: attachment`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add signatures management — table, filtering, CSV export"
```

---

## Task 11: API Routes

**Files:**
- Create: `src/routes/api.ts`

**Step 1: Create API routes**

File `src/routes/api.ts` — Hono router, returns JSON:
- `POST /api/letters/:id` — Autosave: accepts `{ title, content_md, authors_json }`, validates ownership via auth middleware, updates letter, returns `{ ok: true }`
- `POST /api/letters/:id/view` — Increment view count (no auth required), returns `{ ok: true }`

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add JSON API routes for autosave and view tracking"
```

---

## Task 12: Landing Page

**Files:**
- Create: `src/views/landing.ts`

**Step 1: Create landing page view**

File `src/views/landing.ts`:
- Export `landingPage(recentLetters?)` — Full landing page
- Hero section: "Create open letters that matter" headline, subtitle about collecting verified signatures, CTA button → `/login`
- How it works: 3-step grid (Write your letter → Share the link → Collect signatures)
- Recent/featured public letters (if any published letters exist)
- Footer: "Open source · Self-hostable · Privacy-conscious" + GitHub link

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page"
```

---

## Task 13: App Entry Point

**Files:**
- Create: `src/index.ts`
- Create: `src/middleware/error.ts`

**Step 1: Create error middleware**

File `src/middleware/error.ts`:
- Export `errorHandler` — Hono middleware that catches errors, logs them, returns styled error page (404, 500)
- Export `notFoundPage()` — 404 view
- Export `errorPage(message?)` — 500 view

**Step 2: Create main app entry point**

File `src/index.ts`:
- Import Hono and `@hono/node-server` serve function
- Import all route modules
- Create Hono app
- Add static file serving for `/public` directory (use `hono/serve-static`)
- Mount route modules:
  - `app.route('/', publicRoutes)` — landing, public letter
  - `app.route('/', authRoutes)` — login, verify, logout
  - `app.route('/dashboard', dashboardRoutes)` — all dashboard routes
  - `app.route('/api', apiRoutes)` — JSON API
- Add error handler middleware
- Add 404 handler
- Call `serve({ fetch: app.fetch, port })` with PORT from env
- Log startup message

**Step 3: Test the app starts**

Run: `npm run dev`
Expected: Server starts on port 3000, landing page renders at http://localhost:3000

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add app entry point with route mounting and error handling"
```

---

## Task 14: Docker Deployment

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

**Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

EXPOSE 3000

RUN mkdir -p /data

CMD ["node", "--import", "tsx", "src/index.ts"]
```

**Step 2: Create docker-compose.yml**

```yaml
services:
  openletter:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - APP_URL=${APP_URL:-http://localhost:3000}
      - SESSION_SECRET=${SESSION_SECRET:-change-me-please}
      - RESEND_API_KEY=${RESEND_API_KEY:-}
    restart: unless-stopped
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Dockerfile and docker-compose for deployment"
```

---

## Task 15: Integration and Polish

**Step 1: Verify all routes work end-to-end**

Run: `npm run dev` and manually test:
- Landing page loads
- Login page renders
- Dashboard redirects to login when not authenticated
- All static assets (CSS, JS) load correctly

**Step 2: Fix any broken imports, missing exports, or rendering issues**

**Step 3: Update CLAUDE.md with project-specific info**

**Step 4: Update STATE.md and PLAN.md to reflect completion**

**Step 5: Final commit**

```bash
git add -A && git commit -m "chore: polish, fix integration issues, update project docs"
```

---

## Execution Notes

- **Tasks 1-3** are sequential (each depends on the previous)
- **Tasks 4-5** (CSS + views) can run in parallel with Task 3
- **Tasks 6-12** are sequential (each builds on previous routes/views)
- **Task 13** (entry point) depends on all route/view tasks
- **Task 14** (Docker) can run after Task 13
- **Task 15** is always last

**Key SPEC details to honour:**
- All IDs use nanoid, not UUID
- Settings stored as JSON text in SQLite
- Authors stored as JSON array in SQLite
- Emails are NEVER exposed in public views
- Honeypot field on signature form for bot protection
- Cookie: httpOnly, secure (in prod), sameSite=lax, 30-day expiry
- Dev mode: log magic links to console when no RESEND_API_KEY

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.3.0] — 2026-03-29

### Added

- **Custom domain** — OpenLetter now lives at open-letter.uk with full HTTPS support.
- **Branded HTML emails** — magic link and signature verification emails now arrive as styled, branded messages with your letter title and a preview of the content. Plain text fallbacks are included for all email clients.
- **Terms of Service** — a comprehensive Terms of Service page is now available at /terms, covering prohibited content (hate speech, discrimination, defamation, incitement to harm, and more), content responsibility, and moderation policy.
- **Terms acceptance on signup** — new users must agree to the Terms of Service before creating an account.
- **Publish confirmation** — when publishing a letter, you'll be asked to confirm it complies with the Terms of Service.
- **Admin moderation** — platform administrators can now view all letters, soft-remove letters that violate the Terms (showing a violation notice at the public URL), or permanently delete them. Access is controlled via the `ADMIN_EMAIL` environment variable.
- **Favicon** — a branded SVG favicon based on the quill mark.
- **SEO and social sharing** — every page now includes Open Graph and Twitter Card meta tags, a canonical URL, and a meta description. A branded PNG image is used for social previews on LinkedIn and other platforms.
- **Sitemap and robots.txt** — a dynamic sitemap at /sitemap.xml lists all published letters. The robots.txt file blocks crawlers from dashboard and admin pages.
- **llms.txt** — a machine-readable description of the platform at /llms.txt for AI assistants and language models.
- **Footer credits** — the footer now credits Tomcw.xyz and The Good Ship.

### Changed

- **Removed letters show a notice** — if a letter is taken down by an admin, visitors see a clear message explaining it was removed for violating the Terms of Service, rather than a generic 404 page.
- **Admin link in navigation** — if you're the platform admin, an "Admin" link appears in the navigation bar.

## [0.2.1] — 2026-03-29

### Added

- **Fly.io deployment** — deploy to Fly.io with a single `fly deploy` command. Includes `fly.toml` configuration with persistent volume for the SQLite database, auto-stop/start to save costs, and London region by default.
- **Automatic database migration** on container start — the database is created or updated automatically when the Docker container starts, no manual migration step needed.

### Fixed

- **App now reachable in containerised environments** — the server was only listening on localhost, which prevented external connections in Docker and Fly.io. It now listens on all interfaces.

## [0.2.0] — 2026-03-29

### Added

- **SMTP email support** — you can now send emails via any SMTP server, not just Resend. Configure with `SMTP_HOST`, `SMTP_PORT`, and related environment variables. The provider is auto-detected from your config or can be set explicitly with `EMAIL_PROVIDER`.
- **Collapsible preview panel** in the editor — toggle it on and off to get more writing space.
- **Markdown syntax cheat sheet** — click "Syntax help" in the editor toolbar for a quick reference.
- **Thank-you page with sharing** — when email verification is turned off, signatories now see a thank-you page with options to share the letter on social media or copy the link. The page automatically redirects back to the letter after 15 seconds.
- **Signatory avatars** — the signatories section now shows coloured initial avatars next to each name, with a card-based layout.
- **SVG illustrations** throughout — hand-drawn quill brand mark, feature icons on the landing page, wave section dividers, and decorative elements on the login and letter pages.
- **Scroll reveal animations** — content fades in smoothly as you scroll down the page.
- **Grain texture overlay** — a subtle paper-like texture across the site for warmth.
- **Seed script** for development — quickly populate test data with `npx tsx scripts/seed.ts`.

### Changed

- **Complete visual redesign** — new editorial typography (Fraunces + DM Sans), warm cream and navy colour palette with teal and amber accents. Fonts loaded from Bunny Fonts for privacy.
- **Glass-morphism navigation** — the nav bar is now semi-transparent with a blur effect that becomes more opaque as you scroll.
- **Dark CTA section** on the landing page — the call-to-action block now uses a navy background for visual contrast.
- **Improved settings page** — checkboxes now display correctly and save reliably.

### Fixed

- **Publishing and deleting letters now works** — previously, the Publish and Delete buttons were inside a nested HTML form, which browsers silently ignore. These actions now have their own standalone forms.
- **Settings checkboxes render correctly** — checkbox inputs were inheriting full-width block styling, making them appear broken. They now display inline with their labels.

## [0.1.0] — 2026-03-28

### Added

- Create, edit, and delete open letters with a Markdown editor and live preview.
- Passwordless authentication with magic email links.
- Collect signatures with configurable form fields (name, email, organisation, role, location, comment).
- Optional email verification for signatures.
- Public letter pages with editorial typography and a drop-cap first letter.
- Dashboard to manage all your letters, view signature counts, and track status.
- Letter settings: control which fields are shown, toggle public signature/view counts, set a closing date.
- Export signatures as CSV.
- Docker support with a single `docker compose up`.
- Automatic view counting on public letter pages.
- Honeypot spam protection on the signing form.

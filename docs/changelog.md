# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

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

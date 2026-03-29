# OpenLetter

A self-hostable open letter platform. Create letters, collect verified signatures, and manage everything from a simple dashboard.

## Features

- **Markdown editor** with live preview, collapsible sidebar, and syntax help
- **Passwordless auth** via magic email links
- **Signature collection** with optional email verification
- **Public letter pages** with editorial typography and sharing
- **Dashboard** for managing letters, viewing stats, and exporting data
- **Self-hostable** with Docker — SQLite database, no external services required
- **Email flexibility** — SMTP, Resend, or console output for development

## Quick start

```bash
git clone https://github.com/dataforaction-tom/openletter.git
cd openletter
npm install
npm run migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Magic login links are printed to your terminal.

## Docker

```bash
cp .env.example .env
# Edit .env with your settings
docker compose up -d
```

## Email providers

| Provider | Config | Use case |
|----------|--------|----------|
| Console | Nothing needed | Development — links printed to terminal |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, etc. | Self-hosted, any SMTP server or relay |
| Resend | `RESEND_API_KEY` | Cloud/managed |

Set `EMAIL_PROVIDER=smtp|resend|console` or let it auto-detect from your env vars.

## Documentation

- [User Guide](docs/user-guide.md)
- [Self-Hosting Guide](docs/self-hosting.md)
- [Changelog](docs/changelog.md)

## Tech stack

- [Hono](https://hono.dev/) — HTTP framework
- [SQLite](https://www.sqlite.org/) via better-sqlite3
- [Nodemailer](https://nodemailer.com/) — SMTP support
- Server-rendered HTML with vanilla CSS and JS (no build step)

## Licence

MIT

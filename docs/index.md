# OpenLetter

A self-hostable open letter platform. Create letters, collect verified signatures, and manage everything from a simple dashboard.

OpenLetter is free, open source, and designed to run anywhere — on your own server, in Docker, or on any Node.js hosting platform.

## What it does

- **Write open letters** with a markdown editor and live preview
- **Collect signatures** with optional email verification
- **Share publicly** with clean, readable letter pages
- **Manage from a dashboard** — track signatures, export data, configure settings
- **Self-host with confidence** — SQLite database, no external services required

## Getting started

The fastest way to try OpenLetter locally:

```bash
git clone https://github.com/dataforaction-tom/openletter.git
cd openletter
npm install
npm run migrate
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). In development mode, magic login links are printed to your terminal — no email service needed.

For production deployment, see the [Self-Hosting guide](self-hosting.md).

## Need help?

Open an issue on [GitHub](https://github.com/dataforaction-tom/openletter/issues).

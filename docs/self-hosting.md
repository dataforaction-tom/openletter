# Self-Hosting

OpenLetter is designed to run on your own infrastructure. This guide covers setup with Docker, email configuration, and running behind Cloudflare or other reverse proxies.

## Quick start with Docker

The simplest way to deploy:

```bash
git clone https://github.com/dataforaction-tom/openletter.git
cd openletter
cp .env.example .env
# Edit .env with your settings
docker compose up -d
```

Your instance will be available on port 3000.

### Docker Compose configuration

The included `docker-compose.yml` handles everything:

- Builds the app from the Dockerfile
- Mounts a `./data` volume for the SQLite database
- Passes environment variables for configuration
- Restarts automatically unless stopped

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_URL` | Yes | `http://localhost:3000` | The public URL of your instance |
| `SESSION_SECRET` | Yes | — | A random string (32+ characters) for signing session cookies |
| `PORT` | No | `3000` | The port the server listens on |
| `DATA_DIR` | No | `./data` | Where the SQLite database is stored |
| `EMAIL_PROVIDER` | No | auto-detected | `smtp`, `resend`, or `console` |

## Email configuration

OpenLetter needs to send emails for magic link authentication and (optionally) signature verification. Three providers are supported:

### Console (development)

When no email provider is configured, magic links and verification links are printed to the terminal. This is the default for local development.

### SMTP (self-hosted)

Works with any SMTP server — your own mail server, a Docker SMTP relay, or a transactional email service like Mailgun, Postmark, or Brevo.

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=OpenLetter <noreply@yourdomain.com>
```

**Common SMTP setups:**

| Service | Host | Port | Notes |
|---------|------|------|-------|
| Mailgun | `smtp.mailgun.org` | 587 | Free tier: 1,000 emails/month |
| Postmark | `smtp.postmarkapp.com` | 587 | Free tier: 100 emails/month |
| Brevo (Sendinblue) | `smtp-relay.brevo.com` | 587 | Free tier: 300 emails/day |
| Gmail | `smtp.gmail.com` | 587 | Requires app password |
| Local Postfix | `localhost` | 25 | No auth needed if on same network |

For Docker deployments, you can also run a local SMTP relay container alongside OpenLetter.

### Resend (cloud)

If you prefer a modern API-based service:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key
```

### Shared settings

You can set a from address that applies to any provider:

```env
EMAIL_FROM=OpenLetter <noreply@yourdomain.com>
```

## Running behind a reverse proxy

### Cloudflare

OpenLetter works well behind Cloudflare. Set `APP_URL` to your public domain:

```env
APP_URL=https://letters.yourdomain.com
```

Cloudflare handles SSL termination, so the app itself runs on HTTP internally. No additional configuration is needed.

### Nginx

A basic Nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name letters.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```
letters.yourdomain.com {
    reverse_proxy localhost:3000
}
```

## Database

OpenLetter uses SQLite, stored as a single file in `DATA_DIR`. To back up your data, copy the database file. To migrate to a new server, copy the entire `data/` directory.

The database is created automatically on first run via `npm run migrate` (or automatically in Docker).

## Running without Docker

```bash
git clone https://github.com/dataforaction-tom/openletter.git
cd openletter
npm install
npm run migrate
cp .env.example .env
# Edit .env
npm start
```

Use a process manager like PM2 or systemd to keep the app running:

```bash
# With PM2
npm install -g pm2
pm2 start "npm start" --name openletter
pm2 save
```

## Updating

```bash
cd openletter
git pull
npm install
docker compose up -d --build  # if using Docker
# or
npm start                      # if running directly
```

The SQLite database schema is forwards-compatible — updates won't lose your data.

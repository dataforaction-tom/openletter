import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import apiRoutes from './routes/api.js';
import { notFoundPage, errorPage } from './middleware/error.js';
import { layout } from './views/layout.js';
import { landingPage } from './views/landing.js';
import * as db from './lib/db.js';

const app = new Hono();

// Static files
app.use('/css/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));
app.use('/fonts/*', serveStatic({ root: './public' }));
app.use('/favicon.svg', serveStatic({ root: './public', path: '/favicon.svg' }));
app.use('/og-image.svg', serveStatic({ root: './public', path: '/og-image.svg' }));
app.use('/llms.txt', serveStatic({ root: './public', path: '/llms.txt' }));

const appUrl = process.env.APP_URL || 'https://open-letter.uk';

// robots.txt
app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /auth\n\nSitemap: ${appUrl}/sitemap.xml`);
});

// sitemap.xml
app.get('/sitemap.xml', (c) => {
  const letters = db.getRecentPublishedLetters(1000);
  const urls = [
    { loc: appUrl, priority: '1.0' },
    { loc: `${appUrl}/terms`, priority: '0.3' },
    ...letters.map(l => ({ loc: `${appUrl}/l/${l.slug}`, priority: '0.8' })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  return c.newResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
});

// Landing page
app.get('/', (c) => {
  const recentLetters = db.getRecentPublishedLetters(6);
  return c.html(landingPage(recentLetters));
});

// Routes
app.route('/', authRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/admin', adminRoutes);
app.route('/', publicRoutes);
app.route('/api', apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.html(layout('Page not found', notFoundPage()), 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.html(layout('Error', errorPage()), 500);
});

// Start server
const port = parseInt(process.env.PORT || '3000', 10);

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log(`OpenLetter running at http://0.0.0.0:${info.port}`);
  }
);
